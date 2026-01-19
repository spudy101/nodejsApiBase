// src/middlewares/rateLimit.middleware.js
const rateLimit = require('express-rate-limit');
const redisClient = require('../utils/redis.util');
const ApiResponse = require('../utils/response.util');
const { logger } = require('../utils/logger.util');

const RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || 900000;
const RATE_LIMIT_MAX_REQUESTS = process.env.RATE_LIMIT_MAX_REQUESTS || 100;
const RATE_LIMIT_AUTH_WINDOW_MS = process.env.RATE_LIMIT_AUTH_WINDOW_MS || 900000;
const RATE_LIMIT_AUTH_MAX_REQUESTS = process.env.RATE_LIMIT_AUTH_MAX_REQUESTS || 10;

/**
 * Store híbrido simplificado: Redis con fallback a memoria
 */
class HybridStore {
  constructor(prefix, windowMs) {
    this.prefix = prefix;
    this.windowMs = windowMs;
    this.memory = new Map();
    
    // Limpieza periódica de memoria
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.memory.entries()) {
      if (data.resetTime < now) {
        this.memory.delete(key);
      }
    }
  }

  async increment(key) {
    const fullKey = `${this.prefix}${key}`;
    
    // Intentar Redis
    if (redisClient.isAvailable()) {
      try {
        return await this.incrementRedis(fullKey);
      } catch (error) {
        logger.error('Redis increment failed, using memory', { error: error.message });
      }
    }
    
    // Fallback a memoria
    return this.incrementMemory(key);
  }

  async incrementRedis(key) {
    const client = redisClient.getClient();
    const count = await client.incr(key);
    
    if (count === 1) {
      await client.pexpire(key, this.windowMs);
    }
    
    return {
      totalHits: count,
      resetTime: new Date(Date.now() + this.windowMs)
    };
  }

  incrementMemory(key) {
    const now = Date.now();
    const data = this.memory.get(key);
    
    // Nueva entrada o expirada
    if (!data || data.resetTime < now) {
      const newData = {
        hits: 1,
        resetTime: now + this.windowMs
      };
      this.memory.set(key, newData);
      return {
        totalHits: 1,
        resetTime: new Date(newData.resetTime)
      };
    }
    
    // Incrementar existente
    data.hits++;
    return {
      totalHits: data.hits,
      resetTime: new Date(data.resetTime)
    };
  }

  async decrement(key) {
    const fullKey = `${this.prefix}${key}`;
    
    if (redisClient.isAvailable()) {
      try {
        await redisClient.getClient().decr(fullKey);
        return;
      } catch (error) {
        // Continuar con memoria
      }
    }
    
    const data = this.memory.get(key);
    if (data && data.hits > 0) {
      data.hits--;
    }
  }

  async resetKey(key) {
    const fullKey = `${this.prefix}${key}`;
    
    if (redisClient.isAvailable()) {
      try {
        await redisClient.getClient().del(fullKey);
      } catch (error) {
        // Continuar con memoria
      }
    }
    
    this.memory.delete(key);
  }
}

/**
 * Rate limiter para endpoints públicos y autenticación
 */
class RateLimitMiddleware {
  static publicLimiter() {
    return rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      store: new HybridStore('rl:public:', RATE_LIMIT_WINDOW_MS),
      
      // ✅ Usar el keyGenerator por defecto que maneja IPv6 correctamente
      // O simplemente omitir esta opción para usar el default
      
      handler: (req, res) => {
        logger.warn('Rate limit exceeded (public)', {
          ip: req.ip,
          path: req.path,
          usingRedis: redisClient.isAvailable()
        });
        return ApiResponse.tooManyRequests(
          res,
          'Demasiadas peticiones. Intenta más tarde'
        );
      }
    });
  }

  static authLimiter() {
    return rateLimit({
      windowMs: RATE_LIMIT_AUTH_WINDOW_MS,
      max: RATE_LIMIT_AUTH_MAX_REQUESTS,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      store: new HybridStore('rl:auth:', RATE_LIMIT_AUTH_WINDOW_MS),
      
      // ✅ Para auth, combinar email + IP usando el helper oficial
      keyGenerator: (req, opt) => {
        const email = req.body?.email || req.body?.username;
        if (email) {
          return `email:${email.toLowerCase()}`;
        }
        // Usar el helper oficial de express-rate-limit para IPv6
        return opt.ipKeyGenerator(req);
      },
      
      handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', {
          ip: req.ip,
          email: req.body?.email,
          path: req.path,
          usingRedis: redisClient.isAvailable()
        });
        return ApiResponse.tooManyRequests(
          res,
          'Demasiados intentos de autenticación. Intenta en 15 minutos'
        );
      }
    });
  }
}

module.exports = RateLimitMiddleware;