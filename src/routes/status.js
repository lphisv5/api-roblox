import { Router } from 'express';
import { RobloxScraper } from '../services/robloxScraper.js';
import { cache } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { validateTimezone } from '../middleware/validation.js';

const router = Router();
const scraper = new RobloxScraper();

router.get('/status', validateTimezone, asyncHandler(async (req, res) => {
  const timezone = req.query.tz || 'Asia/Bangkok';
  const forceRefresh = req.query.refresh === 'true';
  const cacheKey = `roblox:status:${timezone}`;

  if (!forceRefresh) {
    const cached = await cache.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit', { timezone, cacheKey });
      return res.json({
        cached: true,
        title: 'Roblox System Status',
        icon: '📡',
        ...cached
      });
    }
  }

  const data = await scraper.fetchStatus(timezone);
  await cache.set(cacheKey, data);

  logger.info('Status request completed', {
    timezone,
    cached: false,
    healthPercent: data.health.percent
  });

  res.json({
    cached: false,
    title: 'Roblox System Status',
    icon: '📡',
    ...data
  });
}));

export default router;
