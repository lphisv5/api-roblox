import axios from 'axios';
import { load } from 'cheerio';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const STATUS_URL = 'https://status.roblox.com/';
const CACHE_TTL = 60000;

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

let cache = null;
let cacheTime = 0;

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await axios.get(url, {
        timeout: 8000,
        headers: {
          'User-Agent': 'Roblox-Status-API/2.0',
          'Accept': 'text/html'
        }
      });
      return response;
    } catch (error) {
      if (i === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
    }
  }
}

async function fetchRobloxStatus(tz) {
  const startTime = Date.now();

  try {
    const { data: html } = await fetchWithRetry(STATUS_URL);
    const $ = load(html);

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

    let totalScore = 0;
    let totalServices = 0;
    components.forEach(c => {
      totalScore += c.weight;
      totalServices++;
    });

    const rawPercent = totalServices > 0 ? Math.round(totalScore / totalServices) : 100;
    const healthPercent = Math.max(20, Math.min(100, rawPercent));

    const hasActiveIncidents = $('.unresolved-incident').length > 0;
    const pageStatus = $('.page-status').text().toLowerCase();
    const hasStatusAlert = pageStatus.includes('outage') || pageStatus.includes('disruption');
    const incidentActive = hasActiveIncidents || hasStatusAlert;
    const incidentCount = hasActiveIncidents ? $('.unresolved-incident').length : 0;

    let statusText = 'All Systems Operational';
    let statusEmoji = '🟢';
    let statusState = 'operational';

    if (incidentActive || healthPercent < 80) {
      statusText = 'Service Disruption';
      statusEmoji = '🟠';
      statusState = 'partial';
    } else if (healthPercent < 95) {
      statusText = 'Minor Issues';
      statusEmoji = '🟡';
      statusState = 'degraded';
    }

    const nowUtc = dayjs.utc();
    const local = nowUtc.tz(tz);

    return {
      status: {
        text: statusText,
        emoji: statusEmoji,
        state: statusState
      },
      health: {
        percent: healthPercent,
        emoji: statusEmoji,
        state: statusState
      },
      components,
      incidents: {
        active: incidentActive,
        count: incidentCount,
        message: incidentActive 
          ? `${incidentCount} active incident(s) detected`
          : 'No active incidents detected'
      },
      updated: {
        time: local.format('HH:mm'),
        timezone: tz === 'Asia/Bangkok' ? 'TH' : tz,
        full: local.format('YYYY-MM-DD HH:mm:ss'),
        iso: nowUtc.toISOString(),
        unix: nowUtc.unix()
      },
      meta: {
        official: true,
        source: STATUS_URL,
        scrapeDuration: Date.now() - startTime
      }
    };
  } catch (error) {
    console.error('Fetch error:', error.message);
    throw new Error('Failed to fetch Roblox status: ' + error.message);
  }
}

export default async function handler(req, res) {
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
    const tz = req.query.tz || 'Asia/Bangkok';
    const refresh = req.query.refresh === 'true';

    if (!VALID_TIMEZONES.includes(tz)) {
      return res.status(400).json({
        error: 'INVALID_TIMEZONE',
        message: `Invalid timezone. Valid options: ${VALID_TIMEZONES.join(', ')}`,
        validTimezones: VALID_TIMEZONES
      });
    }

    const now = Date.now();

    if (!refresh && cache && (now - cacheTime < CACHE_TTL)) {
      const cachedResponse = {
        cached: true,
        cacheAge: Math.floor((now - cacheTime) / 1000),
        title: 'Roblox System Status',
        icon: '📡',
        ...cache
      };

      const nowUtc = dayjs.utc();
      const local = nowUtc.tz(tz);
      cachedResponse.updated = {
        time: local.format('HH:mm'),
        timezone: tz === 'Asia/Bangkok' ? 'TH' : tz,
        full: local.format('YYYY-MM-DD HH:mm:ss'),
        iso: nowUtc.toISOString(),
        unix: nowUtc.unix()
      };

      return res.status(200).json(cachedResponse);
    }

    const data = await fetchRobloxStatus(tz);
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

    return res.status(502).json({
      error: 'BAD_GATEWAY',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
