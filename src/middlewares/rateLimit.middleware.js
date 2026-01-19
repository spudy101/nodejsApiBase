// src/middlewares/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redisClient = require('../utils/redis');
const ApiResponse = require('../utils/response');
const { RATE_LIMIT, REDIS_KEYS } = require('../constants');
const { ERRORS } = require('../constants/messages');
const { logger } = require('../utils/logger');

class RateLimitMiddleware {
  // 🔥 Cache de limiters ya creados
  static _limiters = {};

  /**
   * Create rate limiter with Redis store or memory fallback
   */
  static createLimiter(options = {}) {
    const config = {
      windowMs: options.windowMs || RATE_LIMIT.WINDOW_MS,
      max: options.max || RATE_LIMIT.MAX_REQUESTS,
      message: options.message || ERRORS.RATE_LIMIT_EXCEEDED,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,

      keyGenerator: options.keyGenerator || ((req) => {
        const email = req.body?.email || req.body?.username;
        if (email && req.path.includes('auth')) {
          return `email:${email.toLowerCase()}`;
        }

        if (req.user?.id) {
          return `user:${req.user.id}`;
        }

        return `ip:${rateLimit.ipKeyGenerator(req)}`;
      }),

      handler: (req, res) => {
        const email = req.body?.email;
        logger.warn('🚫 Rate limit exceeded', {
          ip: req.ip,
          email,
          userId: req.user?.id,
          path: req.path
        });
        return ApiResponse.tooManyRequests(
          res, 
          options.message || ERRORS.RATE_LIMIT_EXCEEDED
        );
      }
    };

    // Try Redis store
    if (redisClient.isAvailable()) {
      try {
        const client = redisClient.getClient();
        if (client) {
          config.store = new RedisStore({
            // @ts-expect-error - Known issue
            client: client,
            prefix: options.prefix || REDIS_KEYS.RATE_LIMIT,
            sendCommand: (...args) => client.sendCommand(args),
          });
          logger.info('✅ Rate limiter using Redis store', { 
            prefix: options.prefix 
          });
        }
      } catch (error) {
        logger.error('❌ Failed to create Redis store', {
          error: error.message
        });
      }
    }

    // Log if using memory
    if (!config.store) {
      logger.info('📦 Rate limiter using MemoryStore', {
        prefix: options.prefix,
        max: config.max
      });
    }

    return rateLimit(config);
  }

  /**
   * 🔥 NUEVO: Wrapper que crea limiter al primer uso
   */
  static _lazyLimiter(key, factory) {
    return (req, res, next) => {
      if (!this._limiters[key]) {
        this._limiters[key] = factory();
        logger.debug(`Lazy-initialized rate limiter: ${key}`);
      }
      this._limiters[key](req, res, next);
    };
  }

  /**
   * General API rate limiter
   */
  static apiLimiter() {
    return this._lazyLimiter('api', () => this.createLimiter({
      windowMs: RATE_LIMIT.WINDOW_MS,
      max: RATE_LIMIT.MAX_REQUESTS,
      prefix: `${REDIS_KEYS.RATE_LIMIT}api:`
    }));
  }

  /**
   * Auth endpoints rate limiter (stricter)
   */
  static authLimiter() {
    return this._lazyLimiter('auth', () => this.createLimiter({
      windowMs: RATE_LIMIT.AUTH_WINDOW_MS,
      max: RATE_LIMIT.AUTH_MAX_REQUESTS,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      prefix: `${REDIS_KEYS.RATE_LIMIT}auth:`,
      message: 'Demasiados intentos de autenticación. Intente más tarde'
    }));
  }

  /**
   * Create/Update operations limiter
   */
  static writeLimiter() {
    return this._lazyLimiter('write', () => this.createLimiter({
      windowMs: 60 * 1000,
      max: 10,
      prefix: `${REDIS_KEYS.RATE_LIMIT}write:`,
      message: 'Demasiadas operaciones de escritura. Intente más tarde'
    }));
  }

  /**
   * Per-user rate limiter
   */
  static userLimiter(maxRequests = 100) {
    const key = `user_${maxRequests}`;
    return this._lazyLimiter(key, () => this.createLimiter({
      windowMs: RATE_LIMIT.WINDOW_MS,
      max: maxRequests,
      prefix: `${REDIS_KEYS.RATE_LIMIT}user:`,
      keyGenerator: (req) => {
        if (!req.user?.id) {
          const ip = req.ip || req.connection?.remoteAddress || 'unknown';
          const normalizedIp = ip.replace(/^::ffff:/, '').replace(/^::1$/, '127.0.0.1');
          return `ip:${normalizedIp}`;
        }
        return `user:${req.user.id}`;
      }
    }));
  }
}

module.exports = RateLimitMiddleware;