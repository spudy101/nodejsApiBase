'use strict';

const SessionCacheUtil = require('../utils/sessionCache.util');
const AppError = require('../utils/appError.util');
const { logger } = require('../utils/logger.util');

class SessionMiddleware {
  /**
   * Valida sesión activa en cache
   * REQUISITOS:
   * 1. Ejecutar DESPUÉS de audit.middleware (necesita res.locals.deviceFingerprint)
   * 2. Ejecutar DESPUÉS de auth.middleware (necesita req.user)
   */
  static async validateSession(req, res, next) {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw AppError.unauthorized('Usuario no autenticado');
      }

      // Usar deviceFingerprint del audit.middleware (ya generado)
      const deviceFingerprint = res.locals.deviceFingerprint;

      if (!deviceFingerprint) {
        logger.error('deviceFingerprint not found in res.locals - audit middleware missing?');
        throw AppError.serverError('Error de configuración del servidor');
      }

      // Buscar sesión en cache
      const session = await SessionCacheUtil.getSession(userId, deviceFingerprint);

      if (!session) {
        logger.warn('No active session in cache', {
          userId,
          deviceFingerprint,
          ip: req.ip,
        });

        throw AppError.unauthorized(
          'Sesión inválida. Has iniciado sesión desde otro dispositivo. Por favor inicia sesión nuevamente.'
        );
      }

      // Refrescar TTL de la sesión (sliding expiration)
      await SessionCacheUtil.touchSession(userId, deviceFingerprint, 3600);

      // Adjuntar sesión al request
      req.session = session;

      logger.debug('Session validated successfully', { userId, deviceFingerprint });

      next();
    } catch (error) {
      next(error); // Pasar al error handler
    }
  }
}

module.exports = SessionMiddleware;