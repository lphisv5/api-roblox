import { createClient } from 'redis';
import { config } from '../config/environment.js';
import { logger } from './logger.js';

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.redisClient = null;
    this.useRedis = config.cache.redisEnabled;
    
    if (this.useRedis && config.cache.redisUrl) {
      this.initRedis();
    }
  }

  async initRedis() {
    try {
      this.redisClient = createClient({
        url: config.cache.redisUrl
      });

      this.redisClient.on('error', (err) => {
        logger.error('Redis Client Error', { error: err.message });
        this.useRedis = false;
      });

      await this.redisClient.connect();
      logger.info('Redis connected successfully');
    } catch (error) {
      logger.warn('Redis connection failed, falling back to memory cache', {
        error: error.message
      });
      this.useRedis = false;
    }
  }

  async get(key) {
    try {
      if (this.useRedis && this.redisClient?.isOpen) {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      }

      const cached = this.memoryCache.get(key);
      if (!cached) return null;

      if (Date.now() > cached.expiry) {
        this.memoryCache.delete(key);
        return null;
      }

      return cached.data;
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }

  async set(key, value, ttl = config.cache.ttl) {
    try {
      if (this.useRedis && this.redisClient?.isOpen) {
        await this.redisClient.setEx(
          key,
          Math.floor(ttl / 1000),
          JSON.stringify(value)
        );
        return;
      }

      this.memoryCache.set(key, {
        data: value,
        expiry: Date.now() + ttl
      });
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
    }
  }

  async delete(key) {
    try {
      if (this.useRedis && this.redisClient?.isOpen) {
        await this.redisClient.del(key);
        return;
      }

      this.memoryCache.delete(key);
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
    }
  }

  async flush() {
    try {
      if (this.useRedis && this.redisClient?.isOpen) {
        await this.redisClient.flushAll();
      }
      this.memoryCache.clear();
    } catch (error) {
      logger.error('Cache flush error', { error: error.message });
    }
  }
}

export const cache = new CacheManager();
