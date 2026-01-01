// src/middlewares/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../utils/redis');
const ApiResponse = require('../utils/response');
const { RATE_LIMIT, REDIS_KEYS } = require('../constants');
const { ERRORS } = require('../constants/messages');
const { logger } = require('../utils/logger');
const { ipKeyGenerator } = require('express-rate-limit');

class RateLimitMiddleware {
  /**
   * Create rate limiter with Redis store or memory fallback
   */
  static createLimiter(options = {}) {
    const defaultOptions = {
      windowMs: options.windowMs || RATE_LIMIT.WINDOW_MS,
      max: options.max || RATE_LIMIT.MAX_REQUESTS,
      message: options.message || ERRORS.RATE_LIMIT_EXCEEDED,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,

      // ✅ FIX IPv6 + usuarios autenticados
      keyGenerator: options.keyGenerator || ((req, res) => {
        if (req.user?.id) {
          return `user:${req.user.id}`;
        }
        return ipKeyGenerator(req, res);
      }),

      handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
          ip: req.ip,
          userId: req.user?.id,
          path: req.path
        });
        return ApiResponse.tooManyRequests(res, ERRORS.RATE_LIMIT_EXCEEDED);
      }
    };

    // 🔥 Use Redis store if available, memory otherwise
    if (redisClient.isAvailable()) {
      try {
        defaultOptions.store = new RedisStore({
          client: redisClient.getClient(),
          prefix: options.prefix || REDIS_KEYS.RATE_LIMIT,
          sendCommand: (...args) => redisClient.getClient().call(...args),
        });
        logger.debug('Rate limiter using Redis store', { prefix: options.prefix });
      } catch (error) {
        logger.warn('Failed to create Redis store for rate limiter, using memory', {
          error: error.message
        });
        // express-rate-limit usará MemoryStore por default
      }
    } else {
      if (!redisClient.isAvailable() && !this._memoryLogged) {
        logger.debug('Rate limiter using memory store (Redis unavailable)');
        this._memoryLogged = true;
      }
      // ⚠️ Sin Redis = rate limit por instancia (no distribuido)
    }

    return rateLimit(defaultOptions);
  }

  /**
   * General API rate limiter
   */
  static apiLimiter() {
    return this.createLimiter({
      windowMs: RATE_LIMIT.WINDOW_MS,
      max: RATE_LIMIT.MAX_REQUESTS,
      prefix: `${REDIS_KEYS.RATE_LIMIT}api:`
    });
  }

  /**
   * Auth endpoints rate limiter (stricter)
   */
  static authLimiter() {
    return this.createLimiter({
      windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
      max: RATE_LIMIT.AUTH_MAX_REQUESTS,
      skipSuccessfulRequests: false,
      prefix: `${REDIS_KEYS.RATE_LIMIT}auth:`,
      message: 'Demasiados intentos de autenticación. Intente más tarde'
    });
  }

  /**
   * Create/Update operations limiter
   */
  static writeLimiter() {
    return this.createLimiter({
      windowMs: 60 * 1000, // 1 minute
      max: 10,
      prefix: `${REDIS_KEYS.RATE_LIMIT}write:`,
      message: 'Demasiadas operaciones de escritura. Intente más tarde'
    });
  }

  /**
   * Per-user rate limiter
   */
  static userLimiter(maxRequests = 100) {
    return this.createLimiter({
      windowMs: RATE_LIMIT.WINDOW_MS,
      max: maxRequests,
      prefix: `${REDIS_KEYS.RATE_LIMIT}user:`,
      keyGenerator: (req, res) => {
        if (!req.user?.id) {
          return ipKeyGenerator(req, res);
        }
        return `user:${req.user.id}`;
      }
    });
  }
}

module.exports = RateLimitMiddleware;