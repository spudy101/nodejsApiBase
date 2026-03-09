// src/middlewares/request-lock.middleware.js

'use strict';

const redisClient    = require('../utils/redis.util');
const localCache     = require('../utils/cache.util');
const EncryptionUtil = require('../utils/encryption.util');
const ApiResponse    = require('../utils/app-response.util');
const { logger }     = require('../utils/logger.util');
const { TTL }        = require('../constants');

/**
 * Request Lock — previene requests duplicados concurrentes.
 *
 * MEJORA: el lock es por IP/userId + ruta específica.
 * Antes: si el front hacía /perfil y /account al mismo tiempo, uno caía.
 * Ahora: cada ruta tiene su propio lock independiente.
 *
 * Clave para usuarios autenticados: lock:user:{hash(userId + method + path + body)}
 * Clave para endpoints públicos:    lock:ip:{hash(ip + method + path + body)}
 *
 * Dos requests simultáneos a /perfil y /account generan dos keys distintas
 * y nunca se bloquean entre sí.
 */
class RequestLockMiddleware {
  /**
   * Lock para rutas autenticadas (requiere JWT).
   * Identifica al usuario por userId + ruta.
   *
   * @param {{ ttl?: number }} options
   */
  static forAuthenticatedUsers(options = {}) {
    const lockTtl = options.ttl || TTL.REQUEST_LOCK;

    return async (req, res, next) => {
      if (!req.user?.userId) {
        logger.warn('RequestLock — forAuthenticatedUsers usado sin JWT, omitiendo lock');
        return next();
      }

      try {
        const lockKey  = RequestLockMiddleware._buildUserLockKey(req);
        const acquired = await RequestLockMiddleware._acquireLock(lockKey, lockTtl);

        if (!acquired) {
          logger.warn('RequestLock — duplicate request blocked (user)', {
            userId: req.user.userId,
            method: req.method,
            path:   req.path,
          });
          return ApiResponse.conflict(res, 'Petición duplicada detectada. Espera un momento');
        }

        req.lockKey = lockKey;
        res.on('finish', () => RequestLockMiddleware._releaseLock(lockKey));
        next();
      } catch (error) {
        logger.error('RequestLock — error en lock de usuario', { error: error.message });
        next(); // Ante error, dejamos pasar para no bloquear la app
      }
    };
  }

  /**
   * Lock para rutas públicas (sin JWT).
   * Identifica al cliente por IP + ruta.
   *
   * @param {{ ttl?: number }} options
   */
  static forPublicEndpoints(options = {}) {
    const lockTtl = options.ttl || TTL.REQUEST_LOCK_PUBLIC;

    return async (req, res, next) => {
      try {
        const lockKey  = RequestLockMiddleware._buildIpLockKey(req);
        const acquired = await RequestLockMiddleware._acquireLock(lockKey, lockTtl);

        if (!acquired) {
          logger.warn('RequestLock — duplicate request blocked (public)', {
            ip:     req.ip,
            method: req.method,
            path:   req.path,
          });
          return ApiResponse.tooManyRequests(res, 'Petición duplicada. Espera unos segundos');
        }

        req.lockKey = lockKey;
        res.on('finish', () => RequestLockMiddleware._releaseLock(lockKey));
        next();
      } catch (error) {
        logger.error('RequestLock — error en lock público', { error: error.message });
        next();
      }
    };
  }

  // ==============================================
  // PRIVATE HELPERS
  // ==============================================

  /**
   * Lock key para usuarios autenticados.
   * Incluye ruta en el hash → /perfil y /account son independientes.
   */
  static _buildUserLockKey(req) {
    const payload = {
      userId: req.user.userId,
      method: req.method,
      path:   req.path,                                              // ← diferencia por ruta
      body:   ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null,
    };
    return `lock:user:${EncryptionUtil.generateHash(JSON.stringify(payload))}`;
  }

  /**
   * Lock key para endpoints públicos.
   * Incluye ruta en el hash → /login y /register son independientes.
   */
  static _buildIpLockKey(req) {
    const ip = (req.ip || req.connection?.remoteAddress || 'unknown')
      .replace(/^::ffff:/, '')
      .replace(/^::1$/, '127.0.0.1');

    const payload = {
      ip,
      method: req.method,
      path:   req.path,                                              // ← diferencia por ruta
      body:   ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null,
    };
    return `lock:ip:${EncryptionUtil.generateHash(JSON.stringify(payload))}`;
  }

  /**
   * Adquiere el lock de forma atómica.
   * Redis: SET NX (garantiza atomicidad).
   * LocalCache: check-then-set (best-effort, sin garantía estricta).
   *
   * @param {string} key
   * @param {number} ttlSeconds
   * @returns {Promise<boolean>} true si se adquirió, false si ya existía
   */
  static async _acquireLock(key, ttlSeconds) {
    try {
      if (redisClient.isAvailable()) {
        const result = await redisClient.getClient().set(key, '1', 'EX', ttlSeconds, 'NX');
        return result === 'OK';
      }

      // LocalCache — sin atomicidad garantizada pero suficiente para la mayoría de casos
      if (localCache.exists(key)) return false;
      localCache.set(key, '1', ttlSeconds);
      return true;
    } catch (error) {
      logger.error('RequestLock — error acquiring lock', { key, error: error.message });
      return true; // Ante error en el lock, dejamos pasar
    }
  }

  /**
   * Libera el lock al terminar el request.
   * @param {string} key
   */
  static async _releaseLock(key) {
    try {
      if (redisClient.isAvailable()) {
        await redisClient.getClient().del(key);
      } else {
        localCache.del(key);
      }
    } catch (error) {
      logger.error('RequestLock — error releasing lock', { key, error: error.message });
    }
  }
}

module.exports = RequestLockMiddleware;