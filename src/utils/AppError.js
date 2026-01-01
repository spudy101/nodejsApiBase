// src/utils/AppError.js

/**
 * Clase centralizada para manejo de errores operacionales
 * Extiende Error nativo para mantener stack trace
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distingue errores esperados de bugs
    
    Error.captureStackTrace(this, this.constructor);
  }

  // ========== Factory Methods para errores comunes ==========

  /**
   * Bad Request - 400
   */
  static badRequest(message, details = null) {
    return new AppError(message, 400, 'BAD_REQUEST', details);
  }

  /**
   * Unauthorized - 401
   */
  static unauthorized(message = 'No autorizado', details = null) {
    return new AppError(message, 401, 'UNAUTHORIZED', details);
  }

  /**
   * Forbidden - 403
   */
  static forbidden(message = 'Acceso denegado', details = null) {
    return new AppError(message, 403, 'FORBIDDEN', details);
  }

  /**
   * Not Found - 404
   */
  static notFound(message = 'Recurso no encontrado', details = null) {
    return new AppError(message, 404, 'NOT_FOUND', details);
  }

  /**
   * Conflict - 409
   */
  static conflict(message, details = null) {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  /**
   * Too Many Requests - 429
   */
  static tooManyRequests(message = 'Demasiadas peticiones', details = null) {
    return new AppError(message, 429, 'RATE_LIMIT', details);
  }

  /**
   * Internal Server Error - 500
   */
  static internal(message = 'Error interno del servidor', details = null) {
    return new AppError(message, 500, 'INTERNAL_ERROR', details);
  }

  /**
   * Unprocessable Entity - 422
   */
  static unprocessableEntity(message, details = null) {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }
}

module.exports = AppError;
