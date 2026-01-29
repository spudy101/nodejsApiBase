// shared/src/middlewares/requestLock.middleware.js
const redisClient = require('../utils/redis.util');
const localCache = require('../utils/cache.util');
const { logger } = require('../utils/logger.util');
const ApiResponse = require('../utils/response.util');
const EncryptionUtil = require('../utils/encryption.util');
const { TTL } = require('../constants'); // ✅ TTL son constantes fijas

/**
 * Request Lock - Previene requests duplicados
 * - Con JWT: Lock por userId + action
 * - Sin JWT: Lock por IP + action
 */
class RequestLockMiddleware {
  /**
   * Lock para usuarios autenticados (con JWT)
   * Usa userId como identificador único
   * ✅ TTL desde constants (constantes fijas)
   */
  static forAuthenticatedUsers(options = {}) {
    const lockTtl = options.ttl || TTL.REQUEST_LOCK;
    
    return async (req, res, next) => {
      // Verificar que el usuario esté autenticado
      if (!req.user?.userId) {
        logger.warn('⚠️ requestLock.forAuthenticatedUsers usado sin JWT');
        return next(); // Continuar sin lock si no hay user
      }

      try {
        // Generar lock key basado en userId + acción
        const lockKey = this._generateUserLockKey(req);
        
        // Intentar adquirir lock
        const acquired = await this._acquireLock(lockKey, lockTtl);
        
        if (!acquired) {
          logger.warn('🔒 Duplicate request blocked (user)', {
            userId: req.user.userId,
            method: req.method,
            path: req.path
          });
          return ApiResponse.conflict(
            res,
            'Petición duplicada detectada. Espera un momento'
          );
        }

        // Liberar lock al finalizar
        req.lockKey = lockKey;
        res.on('finish', () => this._releaseLock(lockKey));
        
        next();
      } catch (error) {
        logger.error('Error in user request lock', { error: error.message });
        next(); // Continuar en caso de error
      }
    };
  }

  /**
   * Lock para usuarios NO autenticados (sin JWT)
   * Usa IP como identificador
   * ✅ TTL desde constants (constantes fijas)
   */
  static forPublicEndpoints(options = {}) {
    const lockTtl = options.ttl || TTL.REQUEST_LOCK_PUBLIC;
    
    return async (req, res, next) => {
      try {
        // Generar lock key basado en IP + acción
        const lockKey = this._generateIpLockKey(req);
        
        // Intentar adquirir lock
        const acquired = await this._acquireLock(lockKey, lockTtl);
        
        if (!acquired) {
          logger.warn('🔒 Duplicate request blocked (public)', {
            ip: req.ip,
            method: req.method,
            path: req.path
          });
          return ApiResponse.tooManyRequests(
            res,
            'Petición duplicada. Espera unos segundos'
          );
        }

        // Liberar lock al finalizar
        req.lockKey = lockKey;
        res.on('finish', () => this._releaseLock(lockKey));
        
        next();
      } catch (error) {
        logger.error('Error in public request lock', { error: error.message });
        next();
      }
    };
  }

  // ========== Helpers privados ==========

  /**
   * Genera lock key para usuarios autenticados
   */
  static _generateUserLockKey(req) {
    const data = {
      userId: req.user.userId,
      method: req.method,
      path: req.path,
      // Solo incluir body en operaciones de escritura
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null
    };
    const hash = EncryptionUtil.generateHash(JSON.stringify(data));
    return `lock:user:${hash}`;
  }

  /**
   * Genera lock key para IPs (público)
   */
  static _generateIpLockKey(req) {
    const ip = (req.ip || req.connection?.remoteAddress || 'unknown')
      .replace(/^::ffff:/, '')
      .replace(/^::1$/, '127.0.0.1');
    
    const data = {
      ip,
      method: req.method,
      path: req.path,
      body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null
    };
    const hash = EncryptionUtil.generateHash(JSON.stringify(data));
    return `lock:ip:${hash}`;
  }

  /**
   * Adquiere lock (compatible con Redis y LocalCache)
   */
  static async _acquireLock(key, ttl) {
    try {
      if (redisClient.isAvailable()) {
        // Redis: SET NX (atomic)
        const result = await redisClient.getClient().set(
          key,
          '1',
          'EX',
          ttl,
          'NX'
        );
        return result === 'OK';
      } else {
        // LocalCache: simular NX
        const exists = localCache.exists(key);
        if (exists) return false;
        
        localCache.set(key, '1', ttl);
        return true;
      }
    } catch (error) {
      logger.error('Error acquiring lock', { key, error: error.message });
      return false;
    }
  }

  /**
   * Libera lock
   */
  static async _releaseLock(key) {
    try {
      const cache = redisClient.isAvailable() ? redisClient : localCache;
      await cache.del(key);
    } catch (error) {
      logger.error('Error releasing lock', { key, error: error.message });
    }
  }
}

module.exports = RequestLockMiddleware;