// src/middlewares/idempotency.middleware.js
const redisClient = require('../utils/redis');
const { REDIS_KEYS, REDIS_TTL } = require('../constants');
const ApiResponse = require('../utils/response');
const { logger } = require('../utils/logger');

// 🔥 Cache en memoria para fallback
const memoryCache = new Map();

class IdempotencyMiddleware {
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

      if (redisClient.isAvailable()) {
        // ✅ CON REDIS
        const cachedResponse = await redisClient.get(fullKey);

        if (cachedResponse) {
          logger.info('Idempotent request - returning cached response (Redis)', {
            idempotencyKey,
            path: req.path
          });
          return res.status(cachedResponse.statusCode).json(cachedResponse.body);
        }

        // Override res.json to cache response
        const originalJson = res.json.bind(res);
        res.json = function(body) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const cacheData = {
              statusCode: res.statusCode,
              body
            };
            redisClient.set(fullKey, cacheData, REDIS_TTL.IDEMPOTENCY).catch(err => {
              logger.error('Error caching idempotent response', { error: err.message });
            });
          }
          return originalJson(body);
        };

      } else {
        // ⚠️ SIN REDIS: Fallback en memoria
        const cached = memoryCache.get(fullKey);

        if (cached && cached.expires > Date.now()) {
          logger.info('Idempotent request - returning cached response (Memory)', {
            idempotencyKey,
            path: req.path
          });
          return res.status(cached.statusCode).json(cached.body);
        }

        // Override res.json
        const originalJson = res.json.bind(res);
        res.json = function(body) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            memoryCache.set(fullKey, {
              statusCode: res.statusCode,
              body,
              expires: Date.now() + (REDIS_TTL.IDEMPOTENCY * 1000)
            });

            // Cleanup expired entries
            setTimeout(() => {
              memoryCache.delete(fullKey);
            }, REDIS_TTL.IDEMPOTENCY * 1000);
          }
          return originalJson(body);
        };

        logger.debug('Using in-memory idempotency cache', { idempotencyKey });
      }

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

      if (redisClient.isAvailable()) {
        await redisClient.del(fullKey);
      } else {
        memoryCache.delete(fullKey);
      }
    } catch (error) {
      logger.error('Error invalidating idempotency key', { error: error.message });
    }
  }
}

module.exports = IdempotencyMiddleware;