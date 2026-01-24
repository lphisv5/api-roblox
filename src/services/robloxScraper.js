import axios from 'axios';
import { load } from 'cheerio';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import tz from 'dayjs/plugin/timezone.js';
import axiosRetry from 'axios-retry';
import { config } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/errors.js';

dayjs.extend(utc);
dayjs.extend(tz);

const STATUS_URL = 'https://status.roblox.com/';

const STATUS_WEIGHT = {
  'Operational': 100,
  'Degraded Performance': 90,
  'Degraded': 90,
  'Partial Outage': 60,
  'Major Outage': 20
};

const axiosInstance = axios.create({
  timeout: config.scraper.timeout,
  headers: {
    'User-Agent': 'Roblox-Status-API/2.0',
    'Accept': 'text/html'
  }
});

axiosRetry(axiosInstance, {
  retries: config.scraper.retries,
  retryDelay: (retryCount) => {
    return retryCount * config.scraper.retryDelay;
  },
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.code === 'ECONNABORTED';
  },
  onRetry: (retryCount, error) => {
    logger.warn('Retrying request', {
      retryCount,
      error: error.message,
      url: STATUS_URL
    });
  }
});

export class RobloxScraper {
  async fetchStatus(timezone = 'Asia/Bangkok') {
    const startTime = Date.now();

    try {
      const { data: html } = await axiosInstance.get(STATUS_URL);
      const $ = load(html);

      const components = this.parseComponents($);
      const health = this.calculateHealth(components);
      const incidents = this.parseIncidents($);
      const status = this.determineStatus(health, incidents);
      const timestamp = this.formatTimestamp(timezone);

      const result = {
        status,
        health,
        components,
        incidents,
        updated: timestamp,
        meta: {
          official: true,
          source: STATUS_URL,
          scrapeDuration: Date.now() - startTime
        }
      };

      logger.info('Status fetched successfully', {
        duration: result.meta.scrapeDuration,
        healthPercent: health.percent,
        incidentCount: incidents.count
      });

      return result;

    } catch (error) {
      logger.error('Failed to fetch Roblox status', {
        error: error.message,
        stack: error.stack,
        duration: Date.now() - startTime
      });

      if (error.code === 'ECONNABORTED') {
        throw new AppError('Request timeout while fetching Roblox status', 504);
      }

      throw new AppError(
        'Failed to fetch Roblox status from official source',
        502,
        { originalError: error.message }
      );
    }
  }

  parseComponents($) {
    const components = [];

    $('.component').each((_, el) => {
      const name = $(el).find('.name').text().trim();
      const status = $(el).find('.component-status').text().trim();

      if (name && status) {
        components.push({
          name,
          status,
          weight: STATUS_WEIGHT[status] || 0
        });
      }
    });

    return components;
  }

  calculateHealth(components) {
    if (components.length === 0) {
      return {
        percent: 100,
        emoji: '🟢',
        state: 'operational'
      };
    }

    const totalScore = components.reduce((sum, c) => sum + c.weight, 0);
    const rawPercent = Math.round(totalScore / components.length);
    const percent = Math.max(20, Math.min(100, rawPercent));

    return {
      percent,
      emoji: this.getHealthEmoji(percent),
      state: this.getHealthState(percent)
    };
  }

  parseIncidents($) {
    const hasActiveIncidents = $('.unresolved-incident').length > 0;
    const pageStatus = $('.page-status').text().toLowerCase();
    const hasStatusAlert = pageStatus.includes('outage') || 
                          pageStatus.includes('disruption');

    const active = hasActiveIncidents || hasStatusAlert;
    const count = hasActiveIncidents ? $('.unresolved-incident').length : 0;

    return {
      active,
      count,
      message: active 
        ? `${count} active incident(s) detected`
        : 'No active incidents detected'
    };
  }

  determineStatus(health, incidents) {
    if (incidents.active || health.percent < 80) {
      return {
        text: 'Service Disruption',
        emoji: '🟠',
        state: 'partial'
      };
    }

    if (health.percent < 95) {
      return {
        text: 'Minor Issues',
        emoji: '🟡',
        state: 'degraded'
      };
    }

    return {
      text: 'All Systems Operational',
      emoji: '🟢',
      state: 'operational'
    };
  }

  getHealthEmoji(percent) {
    if (percent >= 95) return '🟢';
    if (percent >= 80) return '🟡';
    if (percent >= 40) return '🟠';
    return '🔴';
  }

  getHealthState(percent) {
    if (percent >= 95) return 'operational';
    if (percent >= 80) return 'degraded';
    if (percent >= 40) return 'partial';
    return 'outage';
  }

  formatTimestamp(timezone) {
    const nowUtc = dayjs.utc();
    const local = nowUtc.tz(timezone);

    return {
      time: local.format('HH:mm'),
      timezone: timezone === 'Asia/Bangkok' ? 'TH' : timezone,
      full: local.format('YYYY-MM-DD HH:mm:ss'),
      iso: nowUtc.toISOString(),
      unix: nowUtc.unix()
    };
  }
}
