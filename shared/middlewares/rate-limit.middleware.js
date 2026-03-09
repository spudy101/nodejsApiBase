// src/middlewares/rate-limit.middleware.js

'use strict';

const rateLimit  = require('express-rate-limit');
const redisClient = require('../utils/redis.util');
const ApiResponse = require('../utils/app-response.util');
const { logger }  = require('../utils/logger.util');
const { RATE_LIMIT } = require('../constants');

// ==============================================
// HYBRID STORE — Redis con fallback a memoria
// ==============================================

class HybridStore {
  constructor(prefix, windowMs) {
    this.prefix   = prefix;
    this.windowMs = windowMs;
    this.memory   = new Map();

    // Limpieza periódica de entradas expiradas en memoria
    setInterval(() => this._cleanup(), 60_000);
  }

  _cleanup() {
    const now = Date.now();
    for (const [key, data] of this.memory.entries()) {
      if (data.resetTime < now) this.memory.delete(key);
    }
  }

  async increment(key) {
    const fullKey = `${this.prefix}${key}`;

    if (redisClient.isAvailable()) {
      try {
        return await this._incrementRedis(fullKey);
      } catch (error) {
        logger.warn('RateLimit — Redis increment failed, using memory', { error: error.message });
      }
    }

    return this._incrementMemory(key);
  }

  async _incrementRedis(key) {
    const client = redisClient.getClient();
    const count  = await client.incr(key);
    if (count === 1) await client.pexpire(key, this.windowMs);
    return { totalHits: count, resetTime: new Date(Date.now() + this.windowMs) };
  }

  _incrementMemory(key) {
    const now  = Date.now();
    const data = this.memory.get(key);

    if (!data || data.resetTime < now) {
      const entry = { hits: 1, resetTime: now + this.windowMs };
      this.memory.set(key, entry);
      return { totalHits: 1, resetTime: new Date(entry.resetTime) };
    }

    data.hits++;
    return { totalHits: data.hits, resetTime: new Date(data.resetTime) };
  }

  async decrement(key) {
    const fullKey = `${this.prefix}${key}`;
    if (redisClient.isAvailable()) {
      try { await redisClient.getClient().decr(fullKey); return; } catch {}
    }
    const data = this.memory.get(key);
    if (data && data.hits > 0) data.hits--;
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}${key}`;
    if (redisClient.isAvailable()) {
      try { await redisClient.getClient().del(fullKey); } catch {}
    }
    this.memory.delete(key);
  }
}

// ==============================================
// HELPERS
// ==============================================

const getClientIp = (req) =>
  req.ip ||
  req.headers['x-forwarded-for']?.split(',')[0].trim() ||
  req.headers['x-real-ip'] ||
  req.socket?.remoteAddress ||
  'unknown-ip';

// ==============================================
// RATE LIMIT MIDDLEWARE
// ==============================================

class RateLimitMiddleware {
  /**
   * Limiter general para endpoints públicos.
   * Clave: IP del cliente.
   */
  static publicLimiter() {
    return rateLimit({
      windowMs:       RATE_LIMIT.WINDOW_MS,
      max:            RATE_LIMIT.MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders:  false,
      store:          new HybridStore('rl:public:', RATE_LIMIT.WINDOW_MS),
      keyGenerator:   (req) => getClientIp(req),
      handler: (req, res) => {
        logger.warn('Rate limit exceeded (public)', {
          ip:         getClientIp(req),
          path:       req.path,
          usingRedis: redisClient.isAvailable(),
        });
        return ApiResponse.tooManyRequests(res, 'Demasiadas peticiones. Intenta más tarde');
      },
    });
  }

  /**
   * Limiter estricto para endpoints de autenticación.
   * Clave: email del body si existe, sino IP.
   */
  static authLimiter() {
    return rateLimit({
      windowMs:              RATE_LIMIT.AUTH_WINDOW_MS,
      max:                   RATE_LIMIT.AUTH_MAX_REQUESTS,
      standardHeaders:       true,
      legacyHeaders:         false,
      skipSuccessfulRequests: false,
      store:                 new HybridStore('rl:auth:', RATE_LIMIT.AUTH_WINDOW_MS),
      keyGenerator: (req) => {
        const email = req.body?.email || req.body?.username;
        if (email && typeof email === 'string') return `email:${email.toLowerCase()}`;
        return `ip:${getClientIp(req)}`;
      },
      handler: (req, res) => {
        logger.warn('Rate limit exceeded (auth)', {
          ip:         getClientIp(req),
          email:      req.body?.email,
          path:       req.path,
          usingRedis: redisClient.isAvailable(),
        });
        return ApiResponse.tooManyRequests(
          res,
          'Demasiados intentos de autenticación. Intenta en 15 minutos'
        );
      },
    });
  }
}

module.exports = RateLimitMiddleware;