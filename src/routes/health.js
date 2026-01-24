import { Router } from 'express';
import { cache } from '../utils/cache.js';
import { config } from '../config/environment.js';

const router = Router();
const startTime = Date.now();

router.get('/', async (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  let cacheStatus = 'memory';
  if (config.cache.redisEnabled) {
    try {
      await cache.get('health:check');
      cacheStatus = 'redis';
    } catch {
      cacheStatus = 'memory (redis failed)';
    }
  }

  res.json({
    status: 'healthy',
    uptime,
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    cache: cacheStatus,
    version: '2.0.0'
  });
});

router.get('/ready', async (req, res) => {
  res.json({ ready: true });
});

export default router;
