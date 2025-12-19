const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseHandler');

/**
 * Middleware para manejar errores de forma centralizada
 */
const errorHandler = (err, req, res, next) => {
  // Log del error
  logger.error('Error capturado por errorHandler', {
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id
  });

  // Errores de Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
    return errorResponse(res, 'Errores de validación', 400, errors);
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0]?.path || 'campo';
    return errorResponse(res, `El ${field} ya existe`, 409);
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return errorResponse(res, 'Referencia inválida a otro registro', 400);
  }

  if (err.name === 'SequelizeDatabaseError') {
    return errorResponse(res, 'Error en la base de datos', 500);
  }

  // Errores de autenticación
  if (err.message === 'Token expirado') {
    return errorResponse(res, 'Tu sesión ha expirado', 401);
  }

  if (err.message === 'Token inválido') {
    return errorResponse(res, 'Token de autenticación inválido', 401);
  }

  if (err.name === 'UnauthorizedError') {
    return errorResponse(res, 'No autorizado', 401);
  }

  // Error de validación personalizado
  if (err.statusCode === 400 && err.errors) {
    return errorResponse(res, err.message, 400, err.errors);
  }

  // Errores de transacción
  if (err.code === 'TRANSACTION_ERROR' || err.code === 'QUERY_ERROR') {
    return errorResponse(
      res, 
      err.message || 'Error en la operación de base de datos', 
      500
    );
  }

  // Error 404 - Not Found
  if (err.statusCode === 404) {
    return errorResponse(res, err.message || 'Recurso no encontrado', 404);
  }

  // Error genérico del servidor
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  return errorResponse(res, message, statusCode);
};

/**
 * Middleware para manejar rutas no encontradas (404)
 */
const notFoundHandler = (req, res, next) => {
  logger.warn('Ruta no encontrada', {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip
  });

  return errorResponse(res, `Ruta ${req.originalUrl} no encontrada`, 404);
};

module.exports = {
  errorHandler,
  notFoundHandler
};