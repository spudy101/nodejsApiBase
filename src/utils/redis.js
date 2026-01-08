// src/utils/redis.js
const Redis = require('ioredis');
const { logger } = require('./logger');

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = false;
  }

  async connect() {
    if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
      logger.info('📝 Redis not configured - running without cache');
      this.isEnabled = false;
      return null;
    }

    try {
      const redisConfig = process.env.REDIS_URL ? 
        process.env.REDIS_URL : 
        {
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,
          password: process.env.REDIS_PASSWORD || undefined,
          db: Number(process.env.REDIS_DB) || 0,
        };

      this.client = new Redis(redisConfig, {
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('⚠️  Redis connection failed after 3 retries, disabling Redis');
            this.isEnabled = false;
            return null;
          }
          return Math.min(times * 100, 2000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: false,
        lazyConnect: true,
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis connected and ready');
        this.isConnected = true;
        this.isEnabled = true;
      });

      this.client.on('error', (err) => {
        logger.warn('⚠️  Redis error, running without cache', {
          error: err.message
        });
        this.isConnected = false;
        this.isEnabled = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis reconnecting...');
      });

      await this.client.connect();
      await this.client.ping();
      
      logger.info('✅ Redis ping successful');
      this.isEnabled = true;
      return this.client;

    } catch (error) {
      logger.warn('⚠️  Failed to connect to Redis, running without cache', {
        error: error.message
      });
      this.isEnabled = false;
      this.isConnected = false;
      this.client = null;
      return null;
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        this.isEnabled = false;
        logger.info('Redis client disconnected');
      } catch (error) {
        logger.error('Error disconnecting Redis', { error: error.message });
      }
    }
  }

  getClient() {
    if (!this.isEnabled || !this.isConnected) {
      return null;
    }
    return this.client;
  }

  isAvailable() {
    return this.isEnabled && this.isConnected && this.client !== null;
  }

  async set(key, value, ttl = null) {
    if (!this.isAvailable()) {
      logger.debug('Redis not available, skipping SET', { key });
      return false;
    }

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error', { key, error: error.message });
      this.isEnabled = false;
      return false;
    }
  }

  async get(key) {
    if (!this.isAvailable()) {
      logger.debug('Redis not available, skipping GET', { key });
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      this.isEnabled = false;
      return null;
    }
  }

  // 🔥 FIX: Retorna número en lugar de boolean
  async del(key) {
    if (!this.isAvailable()) {
      logger.debug('Redis not available, skipping DEL', { key });
      return 0;
    }

    try {
      const deleted = await this.client.del(key);
      return deleted; // Retorna 1 si eliminó, 0 si no existía
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      this.isEnabled = false;
      return 0;
    }
  }

  async exists(key) {
    if (!this.isAvailable()) {
      return 0;
    }

    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      this.isEnabled = false;
      return 0;
    }
  }

  async expire(key, seconds) {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE error', { key, error: error.message });
      this.isEnabled = false;
      return false;
    }
  }

  async ttl(key) {
    if (!this.isAvailable()) {
      return -2;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL error', { key, error: error.message });
      this.isEnabled = false;
      return -2;
    }
  }

  async keys(pattern) {
    if (!this.isAvailable()) {
      return [];
    }

    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS error', { pattern, error: error.message });
      this.isEnabled = false;
      return [];
    }
  }

  async flushdb() {
    if (!this.isAvailable()) {
      logger.warn('Cannot flush Redis: not available');
      return false;
    }

    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error('Redis FLUSHDB error', { error: error.message });
      this.isEnabled = false;
      return false;
    }
  }
}

const redisClient = new RedisClient();

module.exports = redisClient;