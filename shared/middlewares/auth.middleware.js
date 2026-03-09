'use strict';

const CognitoUtil = require('../utils/cognito.util');
const EncryptionUtil = require('../utils/encryption.util');
const AppError = require('../utils/app-error.util');
const { logger } = require('../utils/logger.util');
const { server } = require('../constants');

/**
 * Auth Middleware
 *
 * Valida el Access Token (firma + expiración) y el ID Token (custom attributes).
 * No consulta la base de datos — toda la info del usuario viene del JWT.
 *
 * req.user tendrá:
 *   userId      — users.id  (custom:userId del ID Token)
 *   personId    — persons.id (custom:personId del ID Token)
 *   roleName    — nombre del rol (custom:role del ID Token)
 *   cognitoSub  — sub de Cognito
 *   username    — cognito_username
 *   tokenIat    — issued at
 *   tokenExp    — expiration
 *
 * El cliente DEBE enviar ambos tokens:
 *   Authorization: Bearer <accessToken>
 *   X-Id-Token: <idToken>
 */
class AuthMiddleware {
  /**
   * Autenticación básica — solo verifica que el usuario esté autenticado
   */
  static authenticate = async (req, res, next) => {
    try {
      await AuthMiddleware._performAuthentication(req, false);
      next();
    } catch (error) {
      next(error.isOperational ? error : AppError.unauthorized('Error al autenticar usuario'));
    }
  };

  /**
   * Autenticación + validación de rol
   * @param {string[]} allowedRoles
   */
  static requireRole(allowedRoles = []) {
    return async (req, res, next) => {
      try {
        await AuthMiddleware._performAuthentication(req, true);

        if (!allowedRoles.includes(req.user.roleName)) {
          logger.warn('Access denied — insufficient role', {
            userId:       req.user.userId,
            userRole:     req.user.roleName,
            allowedRoles,
            path:         req.path,
          });
          throw AppError.forbidden('No tienes permisos para acceder a este recurso');
        }

        next();
      } catch (error) {
        next(error.isOperational ? error : AppError.unauthorized('Error al autenticar usuario'));
      }
    };
  }

  // ============================================================
  // EXTERNAL / WEBHOOK AUTH (sin cambios)
  // ============================================================

  static externalAuthenticate = (req, res, next) => {
    try {
      const apiKey      = req.header('X-API-Key');
      const validApiKey = AuthMiddleware._validateApiKey(apiKey);

      if (!validApiKey) return next(AppError.unauthorized('API Key inválida'));

      req.externalService = apiKey.substring(0, 24);
      next();
    } catch (error) {
      next(AppError.internal('Error en autenticación externa'));
    }
  };

  static externalWebhookAuthenticate = (req, res, next) => {
    try {
      const apiKey      = req.query.apiKey || req.query.api_key || req.query.key;
      const validApiKey = AuthMiddleware._validateApiKey(apiKey);

      if (!validApiKey) return next(AppError.unauthorized('API Key inválida'));

      req.externalService = 'webhook';
      next();
    } catch (error) {
      next(AppError.internal('Error en autenticación de webhook'));
    }
  };

  // ============================================================
  // PRIVATE
  // ============================================================

  /**
   * @param {Object}  req
   * @param {boolean} requireRole — si true, valida que custom:role esté presente
   * @private
   */
  static async _performAuthentication(req, requireRole = false) {
    // 1. Extraer tokens de los headers
    const accessToken = AuthMiddleware._extractBearerToken(req);
    const idToken     = req.headers['x-id-token'];

    if (!idToken) {
      throw AppError.unauthorized('X-Id-Token header requerido');
    }

    // 2. Validar timestamp cifrado (solo producción)
    if (server.nodeEnv === 'production') {
      AuthMiddleware._validateTimestamp(req);
    }

    // 3. Verificar Access Token (firma + expiración)
    await CognitoUtil.verifyToken(accessToken);

    // 4. Verificar ID Token y extraer custom attributes
    const decoded = await CognitoUtil.verifyIdToken(idToken);

    // 5. Validar que los custom attributes estén presentes
    if (!decoded.userId) {
      logger.error('JWT missing custom:userId — user may not have been provisioned correctly', {
        sub: decoded.sub,
      });
      throw AppError.unauthorized('Token inválido');
    }

    if (requireRole && !decoded.role) {
      logger.warn('JWT missing custom:role', { sub: decoded.sub, userId: decoded.userId });
      throw AppError.unauthorized('Token sin rol asignado');
    }

    // 6. Construir req.user desde el JWT — sin tocar la BD
    req.user = {
      userId:     decoded.userId,
      personId:   decoded.personId,
      roleId:   decoded.roleId || null,
      firstName:   decoded.firstName || null,
      lastName:   decoded.lastName || null,
      nationalId:   decoded.nationalId || null,
      cognitoSub: decoded.sub,
      username:   decoded.username,
      email:      decoded.email,
      tokenIat:   decoded.iat,
      tokenExp:   decoded.exp,
    };

    logger.debug('User authenticated from JWT', {
      userId:   req.user.userId,
      roleName: req.user.roleName || 'N/A',
    });
  }

  static _extractBearerToken(req) {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw AppError.unauthorized('Token no proporcionado');

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw AppError.unauthorized('Formato de Authorization inválido. Use: Bearer <token>');
    }

    return parts[1];
  }

  static _validateTimestamp(req) {
    const encryptedTimestamp = req.headers['x-timestamp'];
    if (!encryptedTimestamp) throw AppError.unauthorized('X-Timestamp header requerido');

    try {
      const requestTime    = parseInt(EncryptionUtil.decrypt(encryptedTimestamp), 10);
      if (isNaN(requestTime)) throw AppError.unauthorized('Timestamp inválido');

      const timeDifference = Math.abs(Date.now() - requestTime) / 1000;
      if (timeDifference > 10) {
        logger.warn('Request timestamp expired', { timeDifference: `${timeDifference.toFixed(2)}s` });
        throw AppError.unauthorized('Timestamp expirado. La solicitud debe realizarse dentro de 10 segundos');
      }
    } catch (error) {
      if (error.isOperational) throw error;
      throw AppError.unauthorized('Error al validar timestamp');
    }
  }

  static _validateApiKey(apiKey) {
    if (!apiKey) return false;
    const { encryption } = require('../constants');
    const validApiKeys   = encryption.externalApiKeys
      ? encryption.externalApiKeys.split(',').map(k => k.trim())
      : [];
    return validApiKeys.includes(apiKey);
  }
}

module.exports = AuthMiddleware;