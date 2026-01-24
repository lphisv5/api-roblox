import axios from 'axios';
import * as cheerio from 'cheerio';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

const STATUS_URL = 'https://status.roblox.com/';
const STATUS_WEIGHT = {
  'Operational': 100,
  'Degraded Performance': 90,
  'Degraded': 90,
  'Partial Outage': 60,
  'Major Outage': 20
};

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'METHOD_NOT_ALLOWED' });
    return;
  }

  try {
    const tz = req.query.tz || 'Asia/Bangkok';
    
    // Fetch HTML
    const response = await axios.get(STATUS_URL, {
      timeout: 8000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RobloxStatusAPI/2.0)',
      }
    });

    const $ = cheerio.load(response.data);

    // Parse components
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

    // Calculate health
    const totalScore = components.reduce((sum, c) => sum + c.weight, 0);
    const healthPercent = components.length > 0 
      ? Math.round(totalScore / components.length) 
      : 100;

    // Check incidents
    const hasIncidents = $('.unresolved-incident').length > 0;
    const incidentCount = hasIncidents ? $('.unresolved-incident').length : 0;

    // Determine status
    let statusText = 'All Systems Operational';
    let statusEmoji = '🟢';
    let statusState = 'operational';

    if (hasIncidents || healthPercent < 80) {
      statusText = 'Service Disruption';
      statusEmoji = '🟠';
      statusState = 'partial';
    } else if (healthPercent < 95) {
      statusText = 'Minor Issues';
      statusEmoji = '🟡';
      statusState = 'degraded';
    }

    // Format timestamp
    const nowUtc = dayjs.utc();
    const local = nowUtc.tz(tz);

    const result = {
      cached: false,
      title: 'Roblox System Status',
      icon: '📡',
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
        active: hasIncidents,
        count: incidentCount,
        message: hasIncidents 
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
        source: STATUS_URL
      }
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Error:', error.message);
    res.status(502).json({
      error: 'BAD_GATEWAY',
      message: 'Failed to fetch Roblox status',
      details: error.message
    });
  }
}
