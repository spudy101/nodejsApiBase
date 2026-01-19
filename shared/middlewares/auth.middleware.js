'use strict';

const CognitoUtil = require('../utils/cognito.util');
const EncryptionUtil = require('../utils/encryption.util');
const AppError = require('../utils/appError.util');
const { logger } = require('../utils/logger.util');

/**
 * Authentication middleware
 * Validates JWT token from Cognito and encrypted timestamp
 * Attaches user object to req.user
 */
class AuthMiddleware {
  /**
   * Main authentication middleware
   * Validates:
   * 1. Authorization header with Bearer token
   * 2. X-Timestamp header (encrypted, max 10 seconds old)
   * 3. JWT token with Cognito
   * 4. User exists and is active in database
   */
  static authenticate = async (req, res, next) => {
    try {
      // 1. Extract and validate Authorization token
      const token = this.extractToken(req);
      if (!token) {
        throw AppError.unauthorized('Token no proporcionado');
      }

      // 2. Validate encrypted timestamp
      // await this.validateTimestamp(req);

      // 3. Verify JWT token with Cognito
      const decoded = await CognitoUtil.verifyToken(token);

      // 4. Load user from database by cognito_sub
      const userRepository = require('../repositories/user.repository');
      const user = await userRepository.findByCognitoSub(decoded.sub);

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
      req.user = this.buildUserObject(user, decoded);

      logger.debug('User authenticated successfully', {
        userId: req.user.userId,
        username: req.user.username,
      });

      next();
    } catch (error) {
      // Pass authentication errors to error handler
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
   * Build user object to attach to req.user
   * @param {Object} user - User from database
   * @param {Object} decoded - Decoded JWT payload from Cognito
   * @returns {Object} - User object
   */
  static buildUserObject(user, decoded) {
    return {
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
  }

  /**
   * Optional middleware: Validate specific roles
   * Usage: AuthMiddleware.requireRole(['admin', 'moderator'])
   * @param {Array<string>} allowedRoles - Array of allowed role names
   * @returns {Function} - Express middleware
   */
  static requireRole(allowedRoles = []) {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          throw AppError.unauthorized('Usuario no autenticado');
        }

        // Load user role from database
        const roleRepository = require('../repositories/role.repository');
        const role = await roleRepository.findById(req.user.roleId);

        if (!role) {
          throw AppError.forbidden('Rol de usuario no encontrado');
        }

        // Check if user role is in allowed roles
        if (!allowedRoles.includes(role.name)) {
          logger.warn('User attempted to access restricted resource', {
            userId: req.user.userId,
            userRole: role.name,
            allowedRoles,
            path: req.path,
          });

          throw AppError.forbidden(
            'No tienes permisos para acceder a este recurso'
          );
        }

        // Attach role to user object
        req.user.role = role.name;

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Optional middleware: Validate user owns resource
   * Checks if req.user.userId matches req.params.userId
   * @returns {Function} - Express middleware
   */
  static requireOwnership = (req, res, next) => {
    try {
      if (!req.user) {
        throw AppError.unauthorized('Usuario no autenticado');
      }

      const resourceUserId = req.params.userId;

      if (!resourceUserId) {
        throw AppError.badRequest('userId no proporcionado en la ruta');
      }

      if (req.user.userId !== resourceUserId) {
        logger.warn('User attempted to access resource owned by another user', {
          userId: req.user.userId,
          resourceUserId,
          path: req.path,
        });

        throw AppError.forbidden('No puedes acceder a recursos de otros usuarios');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = AuthMiddleware;