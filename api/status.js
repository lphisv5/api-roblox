import axios from 'axios';
import { load } from 'cheerio';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import axiosRetry from 'axios-retry';

dayjs.extend(utc);
dayjs.extend(timezone);

const STATUS_URL = 'https://status.roblox.com/';
const CACHE_TTL = 60000; // 60 seconds

const STATUS_WEIGHT = {
  'Operational': 100,
  'Degraded Performance': 90,
  'Degraded': 90,
  'Partial Outage': 60,
  'Major Outage': 20
};

const VALID_TIMEZONES = [
  'Asia/Bangkok',
  'America/New_York', 
  'America/Los_Angeles',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney',
  'UTC'
];

// Vercel Edge Cache
let cache = null;
let cacheTime = 0;

// Configure axios with retry
const axiosInstance = axios.create({
  timeout: 8000,
  headers: {
    'User-Agent': 'Roblox-Status-API/2.0',
    'Accept': 'text/html'
  }
});

axiosRetry(axiosInstance, {
  retries: 2,
  retryDelay: (retryCount) => retryCount * 500,
  retryCondition: (error) => {
    return axiosRetry.isNetworkOrIdempotentRequestError(error) ||
           error.code === 'ECONNABORTED';
  }
});

async function fetchRobloxStatus(tz) {
  const startTime = Date.now();

  try {
    const { data: html } = await axiosInstance.get(STATUS_URL);
    const $ = load(html);

    const components = parseComponents($);
    const health = calculateHealth(components);
    const incidents = parseIncidents($);
    const status = determineStatus(health, incidents);
    const timestamp = formatTimestamp(tz);

    return {
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
  } catch (error) {
    console.error('Fetch error:', error.message);
    
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout while fetching Roblox status');
    }
    
    throw new Error('Failed to fetch Roblox status from official source');
  }
}

function parseComponents($) {
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

function calculateHealth(components) {
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
    emoji: getHealthEmoji(percent),
    state: getHealthState(percent)
  };
}

function parseIncidents($) {
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

function determineStatus(health, incidents) {
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

function getHealthEmoji(percent) {
  if (percent >= 95) return '🟢';
  if (percent >= 80) return '🟡';
  if (percent >= 40) return '🟠';
  return '🔴';
}

function getHealthState(percent) {
  if (percent >= 95) return 'operational';
  if (percent >= 80) return 'degraded';
  if (percent >= 40) return 'partial';
  return 'outage';
}

function formatTimestamp(tz) {
  const nowUtc = dayjs.utc();
  const local = nowUtc.tz(tz);

  return {
    time: local.format('HH:mm'),
    timezone: tz === 'Asia/Bangkok' ? 'TH' : tz,
    full: local.format('YYYY-MM-DD HH:mm:ss'),
    iso: nowUtc.toISOString(),
    unix: nowUtc.unix()
  };
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only GET requests are allowed'
    });
  }

  try {
    const { tz = 'Asia/Bangkok', refresh } = req.query;

    // Validate timezone
    if (!VALID_TIMEZONES.includes(tz)) {
      return res.status(400).json({
        error: 'INVALID_TIMEZONE',
        message: `Invalid timezone. Valid options: ${VALID_TIMEZONES.join(', ')}`,
        validTimezones: VALID_TIMEZONES
      });
    }

    const now = Date.now();
    const forceRefresh = refresh === 'true';

    // Check cache
    if (!forceRefresh && cache && (now - cacheTime < CACHE_TTL)) {
      const cachedResponse = {
        cached: true,
        cacheAge: Math.floor((now - cacheTime) / 1000),
        title: 'Roblox System Status',
        icon: '📡',
        ...cache
      };

      // Update timestamp for current timezone
      cachedResponse.updated = formatTimestamp(tz);

      return res.status(200).json(cachedResponse);
    }

    // Fetch fresh data
    const data = await fetchRobloxStatus(tz);

    // Update cache
    cache = data;
    cacheTime = now;

    return res.status(200).json({
      cached: false,
      title: 'Roblox System Status',
      icon: '📡',
      ...data
    });

  } catch (error) {
    console.error('Handler error:', error);

    const statusCode = error.message.includes('timeout') ? 504 : 502;
    
    return res.status(statusCode).json({
      error: statusCode === 504 ? 'GATEWAY_TIMEOUT' : 'BAD_GATEWAY',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
