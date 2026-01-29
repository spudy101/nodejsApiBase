// shared/src/middlewares/auth.middleware.js
'use strict';

const CognitoUtil = require('../utils/cognito.util');
const EncryptionUtil = require('../utils/encryption.util');
const AppError = require('../utils/appError.util');
const { logger } = require('../utils/logger.util');

// Singleton para almacenar la config una vez inicializado
let serverConfig = null;
let encryptionConfig = null;

/**
 * Authentication middleware
 * Validates JWT token from Cognito and encrypted timestamp
 * Attaches user object to req.user
 */
class AuthMiddleware {
  /**
   * Inicializa el middleware con la configuración del servicio
   * Llamar UNA VEZ al inicio de cada servicio
   */
  static initialize(config) {
    serverConfig = config.server;
    encryptionConfig = config.encryption;
  }

  /**
   * Middleware de autenticación básica (SIN role)
   * Usar cuando solo necesitas que el usuario esté autenticado
   */
  static authenticate = async (req, res, next) => {
    try {
      await this._performAuthentication(req, false); // false = sin role
      next();
    } catch (error) {
      if (error.isOperational) {
        return next(error);
      }
      logger.error('Unexpected error in authentication middleware', {
        error: error.message,
        stack: error.stack,
      });
      next(AppError.unauthorized('Error al autenticar usuario'));
    }
  };

  /**
   * Middleware de autenticación + validación de rol
   * Usar cuando necesitas que el usuario tenga un rol específico
   * @param {Array<string>} allowedRoles - Roles permitidos
   */
  static requireRole(allowedRoles = []) {
    return async (req, res, next) => {
      try {
        // Autentica Y trae el role
        await this._performAuthentication(req, true); // true = con role

        // Valida el rol
        if (!req.user.roleName) {
          throw AppError.forbidden('Rol de usuario no encontrado');
        }

        if (!allowedRoles.includes(req.user.roleName)) {
          logger.warn('User attempted to access restricted resource', {
            userId: req.user.userId,
            userRole: req.user.roleName,
            allowedRoles,
            path: req.path,
          });

          throw AppError.forbidden(
            'No tienes permisos para acceder a este recurso'
          );
        }

        next();
      } catch (error) {
        if (error.isOperational) {
          return next(error);
        }
        logger.error('Unexpected error in requireRole middleware', {
          error: error.message,
          stack: error.stack,
        });
        next(AppError.unauthorized('Error al autenticar usuario'));
      }
    };
  }

  /**
   * Función privada que realiza la autenticación
   * @param {Object} req - Express request
   * @param {boolean} includeRole - Si debe incluir el role en la consulta
   * @private
   */
  static async _performAuthentication(req, includeRole = false) {
    // 1. Extract and validate Authorization token
    const token = this.extractToken(req);
    if (!token) {
      throw AppError.unauthorized('Token no proporcionado');
    }

    // 2. Validate encrypted timestamp (solo en producción)
    if (serverConfig && serverConfig.nodeEnv === 'production') {
      await this.validateTimestamp(req);
    }

    // 3. Verify JWT token with Cognito
    const decoded = await CognitoUtil.verifyToken(token);

    // 4. Load user from database
    const userRepository = require('../../kyc-service/src/infrastructure/database/repositories/user.repository');
    
    // Usar includeLevel según si necesitamos role o no
    const includeLevel = includeRole ? 'auth' : 'minimal';
    const user = await userRepository.findByCognitoSub(decoded.sub, includeLevel);

    if (!user) {
      logger.warn('User not found in database but has valid Cognito token', {
        cognitoSub: decoded.sub,
        username: decoded.username,
      });
      throw AppError.unauthorized('Usuario no encontrado');
    }

    // 5. Validate user status
    if (!user.is_active) {
      logger.warn('Inactive user attempted to authenticate', {
        userId: user.user_id,
        username: user.username,
      });
      throw AppError.forbidden('Cuenta inactiva o suspendida');
    }

    // 6. Build and attach user object to request
    req.user = this.buildUserObject(user, decoded, includeRole);

    logger.debug('User authenticated successfully', {
      userId: req.user.userId,
      username: req.user.username,
      roleName: req.user.roleName || 'N/A',
    });
  }

  /**
   * Build user object to attach to req.user
   * @param {Object} user - User from database
   * @param {Object} decoded - Decoded JWT payload from Cognito
   * @param {boolean} includeRole - Si debe incluir el roleName
   * @returns {Object} - User object
   */
  static buildUserObject(user, decoded, includeRole = false) {
    const userObj = {
      userId: user.user_id,
      username: user.username,
      firstName: user.person?.first_name,
      lastName: user.person?.last_name,
      nationalId: user.person?.national_id,

      cognitoSub: user.cognito_sub,
      cognitoUsername: user.cognito_username,
      personId: user.person_id,
      roleId: user.role_id,
      totpEnabled: user.totp_enabled,
      passwordHash: user.password_hash,

      // JWT info
      tokenIat: decoded.iat,
      tokenExp: decoded.exp,
    };

    // Solo agregar roleName si se incluyó en la consulta
    if (includeRole && user.role) {
      userObj.roleName = user.role.name;
    }

    return userObj;
  }

  /**
   * Extract Bearer token from Authorization header
   * @param {Object} req - Express request object
   * @returns {string|null} - JWT token or null
   */
  static extractToken(req) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return null;
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw AppError.unauthorized(
        'Formato de Authorization inválido. Use: Bearer <token>'
      );
    }

    return parts[1];
  }

  /**
   * Validate encrypted timestamp from X-Timestamp header
   * Ensures request is not older than 10 seconds
   * @param {Object} req - Express request object
   * @throws {AppError} - If timestamp is invalid or expired
   */
  static async validateTimestamp(req) {
    const encryptedTimestamp = req.headers['x-timestamp'];

    if (!encryptedTimestamp) {
      throw AppError.unauthorized('X-Timestamp header requerido');
    }

    try {
      // Decrypt timestamp
      const decryptedTimestamp = EncryptionUtil.decrypt(encryptedTimestamp);

      // Parse timestamp
      const requestTime = parseInt(decryptedTimestamp, 10);

      if (isNaN(requestTime)) {
        throw AppError.unauthorized('Timestamp inválido');
      }

      // Get current time in milliseconds
      const currentTime = Date.now();

      // Calculate time difference in seconds
      const timeDifference = Math.abs(currentTime - requestTime) / 1000;

      // Validate timestamp is within 10 seconds
      if (timeDifference > 10) {
        logger.warn('Request timestamp expired', {
          timeDifference: `${timeDifference.toFixed(2)}s`,
          requestTime: new Date(requestTime).toISOString(),
          currentTime: new Date(currentTime).toISOString(),
        });

        throw AppError.unauthorized(
          'Timestamp expirado. La solicitud debe realizarse dentro de 10 segundos'
        );
      }

      logger.debug('Timestamp validated successfully', {
        timeDifference: `${timeDifference.toFixed(2)}s`,
      });
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }

      logger.error('Error validating timestamp', {
        error: error.message,
      });

      throw AppError.unauthorized('Error al validar timestamp');
    }
  }

  /**
   * Autenticación para servicios externos usando API Key
   * Valida contra las API keys configuradas en .env
   */
  static externalAuthenticate = (req, res, next) => {
    try {
      const apiKey = req.header('X-API-Key');
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: 'API Key requerida'
        });
      }

      // Validar contra las API keys permitidas desde config
      const validApiKeys = encryptionConfig?.externalApiKeys
        ? encryptionConfig.externalApiKeys.split(',').map(k => k.trim())
        : [];
      
      if (validApiKeys.length === 0) {
        logger.error('No external API keys configured in .env');
        return res.status(500).json({
          success: false,
          message: 'Servicio no configurado'
        });
      }

      if (!validApiKeys.includes(apiKey)) {
        logger.warn('Invalid external API key attempt', {
          ip: req.ip,
          path: req.path
        });
        return res.status(403).json({
          success: false,
          message: 'API Key inválida'
        });
      }

      // Opcional: Agregar identificador del servicio en req para logging
      req.externalService = apiKey.substring(0, 24);
      
      next();
    } catch (error) {
      logger.error('Error in external authentication', {
        error: error.message
      });
      return res.status(500).json({
        success: false,
        message: 'Error en autenticación externa'
      });
    }
  };

  /**
   * Autenticación para webhooks externos usando API Key en query params
   */
  static externalWebhookAuthenticate = (req, res, next) => {
    try {
      const apiKey = req.query.apiKey || req.query.api_key || req.query.key;
      
      if (!apiKey) {
        return res.status(401).json({
          success: false,
          message: 'API Key requerida en query params'
        });
      }

      const validApiKeys = encryptionConfig?.externalApiKeys
        ? encryptionConfig.externalApiKeys.split(',').map(k => k.trim())
        : [];
      
      if (validApiKeys.length === 0) {
        logger.error('No external API keys configured in .env');
        return res.status(500).json({
          success: false,
          message: 'Servicio no configurado'
        });
      }

      if (!validApiKeys.includes(apiKey)) {
        logger.warn('Invalid external webhook API key attempt', {
          ip: req.ip,
          path: req.path,
          query: req.query
        });
        return res.status(403).json({
          success: false,
          message: 'API Key inválida'
        });
      }

      req.externalService = 'zapsign-webhook';
      
      next();
    } catch (error) {
      logger.error('Error in external webhook authentication', {
        error: error.message
      });
      return res.status(500).json({
        success: false,
        message: 'Error en autenticación externa'
      });
    }
  };
}

module.exports = AuthMiddleware;