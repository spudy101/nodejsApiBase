// shared/src/middlewares/error.middleware.js
'use strict';

const ApiResponse = require('../utils/response.util');
const AppError = require('../utils/appError.util');
const { HTTP_STATUS, ERROR_CODES, ERRORS } = require('../constants');
const { logger } = require('../utils/logger.util');
const { sanitizeAuditBody } = require('../utils/sanitizeAuditBody.util');

// Singleton para almacenar la config una vez inicializado
let serverConfig = null;

class ErrorMiddleware {
  /**
   * Inicializa el middleware con la configuración del servicio
   * Llamar UNA VEZ al inicio de cada servicio
   */
  static initialize(config) {
    serverConfig = config.server;
  }

  static handleError(err, req, res, next) {
    const errorContext = {
      correlationId: req.correlationId,
      message: err.message,
      stack: serverConfig?.nodeEnv === 'production' ? undefined : err.stack,
      statusCode: err.statusCode || 500,
      code: err.code,
      isOperational: err.isOperational || false,
      path: req.path,
      method: req.method,
      userId: req.user?.userId,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      body: req.method !== 'GET' ? sanitizeAuditBody(req.body) : undefined,
      params: sanitizeAuditBody(req.params),
      query: sanitizeAuditBody(req.query),
    };

    // Log diferenciado según tipo de error
    if (err instanceof AppError && err.isOperational) {
      logger.warn('Operational error', errorContext);
    } else {
      logger.error('Unexpected error', errorContext);
    }

    // AppError (errores operacionales)
    if (err instanceof AppError) {
      // ✅ Caso especial: Error de validación (code: UNPROCESSABLE_ENTITY)
      if (err.code === 'UNPROCESSABLE_ENTITY' && Array.isArray(err.details)) {
        return ApiResponse.validationError(res, err.details);
      }

      // Otros AppErrors
      return ApiResponse.error(
        res,
        err.message,
        err.statusCode,
        err.code,
        {
          ...err.details,
          correlationId: req.correlationId,
        }
      );
    }

    // Sequelize Errors
    if (err.name?.startsWith('Sequelize')) {
      return ErrorMiddleware._handleSequelizeError(err, res, req.correlationId);
    }

    // JWT Errors
    if (err.name === 'JsonWebTokenError') {
      return ApiResponse.unauthorized(res, 'Token inválido');
    }

    if (err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, 'Token expirado');
    }

    // Rate Limiting
    if (err.statusCode === 429 || err.name === 'RateLimitError') {
      return ApiResponse.tooManyRequests(
        res,
        err.message || 'Demasiadas peticiones, intenta más tarde'
      );
    }

    // Multer Errors
    if (err.name === 'MulterError') {
      return ApiResponse.badRequest(res, `Error de carga: ${err.message}`);
    }

    // Error genérico
    return ApiResponse.error(
      res,
      serverConfig?.nodeEnv === 'production' ? ERRORS.INTERNAL_ERROR : err.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR,
      {
        correlationId: req.correlationId,
      }
    );
  }

  static _handleSequelizeError(err, res, correlationId = null) {
    switch (err.name) {
      case 'SequelizeValidationError':
        const errors = err.errors.map(e => ({
          field: e.path,
          message: e.message,
          value: e.value,
        }));
        return ApiResponse.validationError(res, errors);

      case 'SequelizeUniqueConstraintError':
        const field = err.errors[0]?.path || 'unknown';
        return ApiResponse.conflict(res, `El campo '${field}' ya existe`);

      case 'SequelizeForeignKeyConstraintError':
        return ApiResponse.badRequest(res, 'Referencia inválida');

      case 'SequelizeDatabaseError':
        return ApiResponse.error(
          res,
          'Error de base de datos',
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          ERROR_CODES.DATABASE_ERROR,
          correlationId ? { correlationId } : null
        );

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

  static handleNotFound(req, res) {
    logger.warn('Route not found', {
      correlationId: req.correlationId,
      method: req.method,
      path: req.path,
      ip: req.ip,
    });

    return ApiResponse.notFound(
      res,
      `Ruta no encontrada: ${req.method} ${req.path}`
    );
  }

  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = ErrorMiddleware;