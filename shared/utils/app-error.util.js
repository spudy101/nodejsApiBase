// src/utils/app-error.util.js

'use strict';

/**
 * Clase centralizada para manejo de errores operacionales.
 * Extiende Error nativo para mantener stack trace.
 *
 * isOperational = true  → error grave/inesperado → logger.error (5xx)
 * isOperacional = false → error de negocio esperado → logger.warn (4xx)
 */
class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null, isOperational = true) {
    super(message);
    this.name        = this.constructor.name;
    this.statusCode  = statusCode;
    this.code        = code;
    this.details     = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }

  // ==============================================
  // FACTORY METHODS
  // ==============================================

  /** 400 — Parámetros incorrectos o faltantes */
  static badRequest(message, details = null) {
    return new AppError(message, 400, 'BAD_REQUEST', details, false);
  }

  /** 401 — No autenticado */
  static unauthorized(message = 'No autorizado', details = null) {
    return new AppError(message, 401, 'UNAUTHORIZED', details, false);
  }

  /** 403 — Autenticado pero sin permiso */
  static forbidden(message = 'Acceso denegado', details = null) {
    return new AppError(message, 403, 'FORBIDDEN', details, false);
  }

  /** 404 — Recurso no encontrado */
  static notFound(message = 'Recurso no encontrado', details = null) {
    return new AppError(message, 404, 'NOT_FOUND', details, false);
  }

  /** 409 — Conflicto de estado (ej: recurso ya existe) */
  static conflict(message, details = null) {
    return new AppError(message, 409, 'CONFLICT', details, false);
  }

  /** 422 — Datos válidos sintácticamente pero incorrectos semánticamente */
  static unprocessableEntity(message, details = null) {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details, false);
  }

  /** 429 — Rate limit excedido */
  static tooManyRequests(message = 'Demasiadas peticiones', details = null) {
    return new AppError(message, 429, 'RATE_LIMIT', details, false);
  }

  /** 500 — Error interno del servidor (bug real) */
  static internal(message = 'Error interno del servidor', details = null) {
    return new AppError(message, 500, 'INTERNAL_ERROR', details, true);
  }
}

module.exports = AppError;