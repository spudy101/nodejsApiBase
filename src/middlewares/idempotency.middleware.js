// src/middlewares/idempotency.middleware.js
const redisClient = require('../utils/redis');
const localCache = require('../utils/cache'); // 🔥 CAMBIO
const { REDIS_KEYS, REDIS_TTL } = require('../constants');
const ApiResponse = require('../utils/response');
const { logger } = require('../utils/logger');

class IdempotencyMiddleware {
  /**
   * 🔥 Get cache (Redis o LocalCache)
   */
  static getCache() {
    return redisClient.isAvailable() ? redisClient : localCache;
  }

  /**
   * Handle idempotent requests
   */
  static async handleIdempotency(req, res, next) {
    // Only for POST, PUT, PATCH
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'];

    if (!idempotencyKey) {
      return next(); // Idempotency is optional
    }

    try {
      const fullKey = `${REDIS_KEYS.IDEMPOTENCY}${idempotencyKey}`;
      const cache = this.getCache();

      // 🔥 Check cached response (unified)
      const cachedData = await cache.get(fullKey);

      if (cachedData) {
        let cachedResponse;
        
        // Parse data (puede ser string o objeto)
        try {
          cachedResponse = typeof cachedData === 'string' 
            ? JSON.parse(cachedData) 
            : cachedData;
        } catch {
          cachedResponse = cachedData;
        }

        logger.info('Idempotent request - returning cached response', {
          idempotencyKey,
          path: req.path,
          source: redisClient.isAvailable() ? 'Redis' : 'LocalCache'
        });

        return res.status(cachedResponse.statusCode).json(cachedResponse.body);
      }

      // 🔥 Override res.json to cache response
      const originalJson = res.json.bind(res);
      res.json = function(body) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const cacheData = {
            statusCode: res.statusCode,
            body
          };
          
          cache.set(
            fullKey, 
            JSON.stringify(cacheData), 
            REDIS_TTL.IDEMPOTENCY
          ).catch(err => {
            logger.error('Error caching idempotent response', { error: err.message });
          });
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Idempotency middleware error', { error: error.message });
      next(); // Continue on error
    }
  }

  /**
   * Invalidate idempotency key
   */
  static async invalidateKey(idempotencyKey) {
    try {
      const fullKey = `${REDIS_KEYS.IDEMPOTENCY}${idempotencyKey}`;
      await this.getCache().del(fullKey);
    } catch (error) {
      logger.error('Error invalidating idempotency key', { error: error.message });
    }
  }
}

module.exports = IdempotencyMiddleware;