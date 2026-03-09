// src/utils/redis.util.js

'use strict';

const Redis = require('ioredis');
const { logger } = require('./logger.util');
const { redis: redisConfig } = require('../constants');

class RedisClient {
  constructor() {
    this.client      = null;
    this.isConnected = false;
    this.isEnabled   = false;
  }

  async connect() {
    if (!redisConfig.enabled) {
      logger.info('Redis not configured — running with local cache');
      return null;
    }

    try {
      const connectionConfig = redisConfig.url
        ? redisConfig.url
        : {
            host:     redisConfig.host,
            port:     redisConfig.port,
            password: redisConfig.password || undefined,
            db:       redisConfig.db,
          };

      this.client = new Redis(connectionConfig, {
        retryStrategy: (times) => {
          if (times > 3) {
            logger.warn('Redis — max retries reached, disabling');
            this.isEnabled = false;
            return null;
          }
          return Math.min(times * 100, 2000);
        },
        maxRetriesPerRequest: 3,
        enableReadyCheck:     true,
        enableOfflineQueue:   false,
        lazyConnect:          true,
      });

      this.client.on('ready', () => {
        logger.info('Redis connected', {
          host: redisConfig.host,
          port: redisConfig.port,
          db:   redisConfig.db,
        });
        this.isConnected = true;
        this.isEnabled   = true;
      });

      this.client.on('error', (err) => {
        logger.warn('Redis error — falling back to local cache', { error: err.message });
        this.isConnected = false;
        this.isEnabled   = false;
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

      this.isEnabled = true;
      return this.client;
    } catch (error) {
      logger.warn('Redis connection failed — falling back to local cache', { error: error.message });
      this.isEnabled   = false;
      this.isConnected = false;
      this.client      = null;
      return null;
    }
  }

  async disconnect() {
    if (!this.client) return;
    try {
      await this.client.quit();
      this.isConnected = false;
      this.isEnabled   = false;
      logger.info('Redis disconnected');
    } catch (error) {
      logger.error('Redis disconnect error', { error: error.message });
    }
  }

  /** @returns {import('ioredis').Redis|null} */
  getClient() {
    return this.isAvailable() ? this.client : null;
  }

  /** @returns {boolean} */
  isAvailable() {
    return this.isEnabled && this.isConnected && this.client !== null;
  }

  // ==============================================
  // OPERACIONES — API compatible con cache.util.js
  // ==============================================

  async set(key, value, ttl = null) {
    if (!this.isAvailable()) return false;
    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      if (ttl) {
        await this.client.set(key, serialized, 'EX', ttl);
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
    if (!this.isAvailable()) return null;
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      try {
        return JSON.parse(value);
      } catch {
        return value; // Retorna string plano si no es JSON
      }
    } catch (error) {
      logger.error('Redis GET error', { key, error: error.message });
      this.isEnabled = false;
      return null;
    }
  }

  async del(key) {
    if (!this.isAvailable()) return 0;
    try {
      return await this.client.del(key);
    } catch (error) {
      logger.error('Redis DEL error', { key, error: error.message });
      this.isEnabled = false;
      return 0;
    }
  }

  async exists(key) {
    if (!this.isAvailable()) return 0;
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis EXISTS error', { key, error: error.message });
      this.isEnabled = false;
      return 0;
    }
  }

  async expire(key, seconds) {
    if (!this.isAvailable()) return false;
    try {
      return await this.client.expire(key, seconds);
    } catch (error) {
      logger.error('Redis EXPIRE error', { key, error: error.message });
      this.isEnabled = false;
      return false;
    }
  }

  async ttl(key) {
    if (!this.isAvailable()) return -2;
    try {
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL error', { key, error: error.message });
      this.isEnabled = false;
      return -2;
    }
  }

  async keys(pattern) {
    if (!this.isAvailable()) return [];
    try {
      return await this.client.keys(pattern);
    } catch (error) {
      logger.error('Redis KEYS error', { pattern, error: error.message });
      this.isEnabled = false;
      return [];
    }
  }

  async flush() {
    if (!this.isAvailable()) return false;
    try {
      await this.client.flushdb();
      return true;
    } catch (error) {
      logger.error('Redis FLUSH error', { error: error.message });
      this.isEnabled = false;
      return false;
    }
  }
}

module.exports = new RedisClient();