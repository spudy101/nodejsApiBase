// src/middlewares/error.middleware.js

'use strict';

const ApiResponse         = require('../utils/app-response.util');
const AppError            = require('../utils/app-error.util');
const { logger, sanitizeForLog } = require('../utils/logger.util');
const { HTTP_STATUS, ERROR_CODES, ERROR_MESSAGES, server } = require('../constants');

class ErrorMiddleware {
  /**
   * Manejador global de errores — debe registrarse al final del pipeline en app.js.
   * app.use(ErrorMiddleware.handleError)
   */
  static handleError(err, req, res, next) {
    const errorContext = {
      correlationId: req.correlationId,
      message:       err.message,
      stack:         server.nodeEnv !== 'production' ? err.stack : undefined,
      statusCode:    err.statusCode || 500,
      code:          err.code,
      isOperational: err.isOperational || false,
      path:          req.path,
      method:        req.method,
      userId:        req.user?.userId,
      ip:            req.ip,
      userAgent:     req.headers['user-agent'],
      body:          req.method !== 'GET' ? sanitizeForLog(req.body) : undefined,
      params:        sanitizeForLog(req.params),
      query:         sanitizeForLog(req.query),
    };

    // Log diferenciado: 5xx como error, 4xx como warn
    if (err instanceof AppError && err.isOperational) {
      logger.error('Operational error', errorContext);
    } else if (err instanceof AppError) {
      logger.warn('Business error', {
        correlationId: req.correlationId,
        message:       err.message,
        statusCode:    err.statusCode,
        code:          err.code,
        path:          req.path,
        userId:        req.user?.userId,
      });
    } else {
      logger.error('Unexpected error', errorContext);
    }

    // ==============================================
    // AppError — errores controlados de la app
    // ==============================================
    if (err instanceof AppError) {
      if (err.code === 'UNPROCESSABLE_ENTITY' && Array.isArray(err.details)) {
        return ApiResponse.validationError(res, err.details);
      }

      return ApiResponse.error(res, err.message, err.statusCode, err.code, {
        ...err.details,
        correlationId: req.correlationId,
      });
    }

    // ==============================================
    // Sequelize errors
    // ==============================================
    if (err.name?.startsWith('Sequelize')) {
      return ErrorMiddleware._handleSequelizeError(err, res, req.correlationId);
    }

    // ==============================================
    // JWT errors
    // ==============================================
    if (err.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.TOKEN_INVALID);
    }

    if (err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, ERROR_MESSAGES.TOKEN_EXPIRED);
    }

    // ==============================================
    // Rate limit
    // ==============================================
    if (err.statusCode === 429 || err.name === 'RateLimitError') {
      return ApiResponse.tooManyRequests(res, err.message || ERROR_MESSAGES.RATE_LIMIT_EXCEEDED);
    }

    // ==============================================
    // Multer (uploads)
    // ==============================================
    if (err.name === 'MulterError') {
      return ApiResponse.badRequest(res, `Error de carga: ${err.message}`);
    }

    // ==============================================
    // Error genérico no controlado
    // ==============================================
    return ApiResponse.error(
      res,
      server.nodeEnv === 'production' ? ERROR_MESSAGES.INTERNAL_ERROR : err.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
      { correlationId: req.correlationId }
    );
  }

  /**
   * Handler para rutas no encontradas — registrar antes del handleError.
   * app.use(ErrorMiddleware.handleNotFound)
   */
  static handleNotFound(req, res) {
    logger.warn('Route not found', {
      correlationId: req.correlationId,
      method:        req.method,
      path:          req.path,
      ip:            req.ip,
    });

    return ApiResponse.notFound(res, `Ruta no encontrada: ${req.method} ${req.path}`);
  }

  /**
   * Wrapper para controllers async — elimina la necesidad de try/catch en cada uno.
   *
   * @example
   * router.get('/users', asyncHandler(UserController.getAll));
   */
  static asyncHandler(fn) {
    return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
  }

  // ==============================================
  // PRIVATE
  // ==============================================

  static _handleSequelizeError(err, res, correlationId) {
    switch (err.name) {
      case 'SequelizeValidationError': {
        const errors = err.errors.map((e) => ({
          field:   e.path,
          message: e.message,
          value:   e.value,
        }));
        return ApiResponse.validationError(res, errors);
      }

      case 'SequelizeUniqueConstraintError': {
        const field = err.errors[0]?.path || 'unknown';
        return ApiResponse.conflict(res, `El campo '${field}' ya existe`);
      }

      case 'SequelizeForeignKeyConstraintError':
        return ApiResponse.badRequest(res, 'Referencia inválida');

      default:
        return ApiResponse.error(
          res,
          'Error de base de datos',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODES.DATABASE_ERROR,
          correlationId ? { correlationId } : null
        );
    }
  }
}

module.exports = ErrorMiddleware;