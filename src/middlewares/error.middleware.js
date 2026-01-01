// src/middlewares/error.middleware.js
const ApiResponse = require('../utils/response');
const AppError = require('../utils/AppError');
const { HTTP_STATUS, ERROR_CODES } = require('../constants');
const { ERRORS } = require('../constants/messages');
const { logger } = require('../utils/logger');

class ErrorMiddleware {
  /**
   * Global error handler
   * Maneja todos los errores de la aplicación
   */
  static handleError(err, req, res, next) {
    // Log del error para debugging
    logger.error('Error handler caught error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      userId: req.user?.id
    });

    // ========================================
    // Errores operacionales (esperados)
    // ========================================
    if (err instanceof AppError) {
      return ApiResponse.error(
        res,
        err.message,
        err.statusCode,
        err.code,
        err.details
      );
    }

    // ========================================
    // Errores de Sequelize
    // ========================================
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => ({
        field: e.path,
        message: e.message,
        value: e.value
      }));
      return ApiResponse.validationError(res, errors);
    }

    if (err.name === 'SequelizeUniqueConstraintError') {
      return ApiResponse.conflict(res, 'El recurso ya existe');
    }

    if (err.name === 'SequelizeForeignKeyConstraintError') {
      return ApiResponse.badRequest(res, 'Referencia inválida');
    }

    if (err.name === 'SequelizeDatabaseError') {
      return ApiResponse.error(
        res,
        'Error de base de datos',
        HTTP_STATUS.INTERNAL_SERVER_ERROR,
        ERROR_CODES.DATABASE_ERROR
      );
    }

    // ========================================
    // Errores de JWT
    // ========================================
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return ApiResponse.unauthorized(res, ERRORS.TOKEN_INVALID);
    }

    // ========================================
    // Errores de Multer (file upload)
    // ========================================
    if (err.name === 'MulterError') {
      return ApiResponse.badRequest(res, `Error de carga: ${err.message}`);
    }

    // ========================================
    // Errores no manejados (bugs/unexpected)
    // ========================================
    // En producción NO exponemos detalles del error por seguridad
    return ApiResponse.error(
      res,
      process.env.NODE_ENV === 'production' 
        ? ERRORS.INTERNAL_ERROR 
        : err.message,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      ERROR_CODES.INTERNAL_ERROR
    );
  }

  /**
   * Handle 404 - Not Found
   * Maneja rutas que no existen
   */
  static handleNotFound(req, res) {
    logger.warn('Route not found', {
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    return ApiResponse.notFound(
      res,
      `Ruta no encontrada: ${req.method} ${req.path}`
    );
  }

  /**
   * Async error wrapper
   * Envuelve funciones async para capturar errores automáticamente
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = ErrorMiddleware;
