// src/middleware/requestLock.middleware.js
const redisClient = require('../utils/redis');
const localCache = require('../utils/cache'); // 🔥 NUEVO
const { REDIS_KEYS, REDIS_TTL, REQUEST_LOCK } = require('../constants');
const { ERRORS } = require('../constants/messages');
const ApiResponse = require('../utils/response');
const { logger } = require('../utils/logger');
const EncryptionUtil = require('../utils/encryption');

class RequestLockMiddleware {
  /**
   * 🔥 Get cache (Redis o LocalCache)
   */
  static getCache() {
    return redisClient.isAvailable() ? redisClient : localCache;
  }

  /**
   * Prevent duplicate requests
   */
  static async preventDuplicates(req, res, next) {
    // Only lock write operations
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    try {
      // Generate unique key for this request
      const lockKey = this.generateLockKey(req);
      const fullKey = `${REDIS_KEYS.REQUEST_LOCK}${lockKey}`;

      // Try to acquire lock
      const acquired = await this.acquireLock(fullKey);

      if (!acquired) {
        logger.warn('Duplicate request detected', {
          method: req.method,
          path: req.path,
          userId: req.user?.id,
          ip: req.ip
        });
        return ApiResponse.conflict(res, ERRORS.REQUEST_LOCKED);
      }

      // Store lock key for release
      req.lockKey = fullKey;

      // Release lock after response
      res.on('finish', async () => {
        await this.releaseLock(fullKey);
      });

      next();
    } catch (error) {
      logger.error('Request lock error', { error: error.message });
      next(); // Continue on error
    }
  }

  /**
   * Generate lock key
   */
  static generateLockKey(req) {
    const keyData = {
      method: req.method,
      path: req.path,
      userId: req.user?.id || 'anonymous',
      body: req.body
    };
    return EncryptionUtil.generateHash(JSON.stringify(keyData));
  }

  /**
   * Acquire lock (compatible Redis/LocalCache)
   */
  static async acquireLock(key) {
    try {
      const cache = this.getCache();
      
      if (redisClient.isAvailable()) {
        // Redis: usa SET NX (atomic)
        const result = await redisClient.getClient().set(
          key,
          'locked',
          'EX',
          REDIS_TTL.REQUEST_LOCK,
          'NX'
        );
        return result === 'OK';
      } else {
        // LocalCache: simula comportamiento NX
        const exists = cache.exists(key);
        if (exists) {
          return false; // Ya existe = no adquirido
        }
        
        cache.set(key, 'locked', REDIS_TTL.REQUEST_LOCK);
        return true;
      }
    } catch (error) {
      logger.error('Error acquiring lock', { error: error.message });
      return false;
    }
  }

  /**
   * Release lock
   */
  static async releaseLock(key) {
    try {
      await this.getCache().del(key);
    } catch (error) {
      logger.error('Error releasing lock', { error: error.message });
    }
  }
}

module.exports = RequestLockMiddleware;