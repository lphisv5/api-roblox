import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  
  cache: {
    ttl: parseInt(process.env.CACHE_TTL || '60000', 10),
    redisUrl: process.env.REDIS_URL || null,
    redisEnabled: process.env.REDIS_ENABLED === 'true'
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10)
  },
  
  scraper: {
    timeout: parseInt(process.env.SCRAPER_TIMEOUT || '10000', 10),
    retries: parseInt(process.env.SCRAPER_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.SCRAPER_RETRY_DELAY || '1000', 10)
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true'
  },
  
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
};
