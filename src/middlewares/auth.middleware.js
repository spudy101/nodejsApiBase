// src/middleware/auth.middleware.js
const JWTUtil = require('../utils/jwt');
const ApiResponse = require('../utils/response');
const { ERRORS } = require('../constants/messages');
const { logger } = require('../utils/logger');
const db = require('../models');

class AuthMiddleware {
  /**
   * Verify JWT token
   */
  static async verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return ApiResponse.unauthorized(res, ERRORS.TOKEN_REQUIRED);
      }

      const token = authHeader.substring(7);

      // Check if token is blacklisted
      const isBlacklisted = await JWTUtil.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return ApiResponse.unauthorized(res, ERRORS.TOKEN_INVALID);
      }

      // Verify token
      const decoded = JWTUtil.verifyAccessToken(token);

      // Get user from database
      const user = await db.User.findByPk(decoded.id);

      if (!user) {
        return ApiResponse.unauthorized(res, ERRORS.USER_NOT_FOUND);
      }

      if (!user.isActive) {
        return ApiResponse.unauthorized(res, ERRORS.USER_INACTIVE);
      }

      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      };

      req.token = token;

      next();
    } catch (error) {
      logger.error('Auth middleware error', { error: error.message });

      if (error.name === 'TokenExpiredError') {
        return ApiResponse.unauthorized(res, ERRORS.TOKEN_EXPIRED);
      }

      if (error.name === 'JsonWebTokenError') {
        return ApiResponse.unauthorized(res, ERRORS.TOKEN_INVALID);
      }

      return ApiResponse.unauthorized(res, ERRORS.UNAUTHORIZED);
    }
  }

  /**
   * Check user role
   */
  static authorize(...allowedRoles) {
    return (req, res, next) => {
      if (!req.user) {
        return ApiResponse.unauthorized(res, ERRORS.UNAUTHORIZED);
      }

      if (!allowedRoles.includes(req.user.role)) {
        return ApiResponse.forbidden(res, ERRORS.FORBIDDEN);
      }

      next();
    };
  }

  /**
   * Optional authentication (doesn't fail if no token)
   */
  static async optionalAuth(req, res, next) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
      }

      const token = authHeader.substring(7);
      const decoded = JWTUtil.verifyAccessToken(token);
      const user = await db.User.findByPk(decoded.id);

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name
        };
      }

      next();
    } catch (error) {
      // Silently fail for optional auth
      next();
    }
  }
}

module.exports = AuthMiddleware;