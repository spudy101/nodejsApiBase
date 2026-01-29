// src/utils/appError.util.js

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
   * Method Not Allowed - 405
   */
  static methodNotAllowed(message = 'Método no permitido', details = null) {
    return new AppError(message, 405, 'METHOD_NOT_ALLOWED', details);
  }

  /**
   * Not Acceptable - 406
   */
  static notAcceptable(message = 'Formato de respuesta no aceptable', details = null) {
    return new AppError(message, 406, 'NOT_ACCEPTABLE', details);
  }

  /**
   * Request Timeout - 408
   */
  static requestTimeout(message = 'Tiempo de espera agotado', details = null) {
    return new AppError(message, 408, 'REQUEST_TIMEOUT', details);
  }

  /**
   * Conflict - 409
   */
  static conflict(message, details = null) {
    return new AppError(message, 409, 'CONFLICT', details);
  }

  /**
   * Gone - 410
   */
  static gone(message = 'Recurso ya no disponible', details = null) {
    return new AppError(message, 410, 'GONE', details);
  }

  /**
   * Precondition Failed - 412
   */
  static preconditionFailed(message = 'Precondición fallida', details = null) {
    return new AppError(message, 412, 'PRECONDITION_FAILED', details);
  }

  /**
   * Payload Too Large - 413
   */
  static payloadTooLarge(message = 'Carga útil demasiado grande', details = null) {
    return new AppError(message, 413, 'PAYLOAD_TOO_LARGE', details);
  }

  /**
   * Unsupported Media Type - 415
   */
  static unsupportedMediaType(message = 'Tipo de contenido no soportado', details = null) {
    return new AppError(message, 415, 'UNSUPPORTED_MEDIA_TYPE', details);
  }

  /**
   * Unprocessable Entity - 422
   */
  static unprocessableEntity(message, details = null) {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', details);
  }

  /**
   * Locked - 423
   */
  static locked(message = 'Recurso bloqueado', details = null) {
    return new AppError(message, 423, 'LOCKED', details);
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
   * Server Error - 500 (alias)
   */
  static serverError(message = 'Error del servidor', details = null) {
    return new AppError(message, 500, 'SERVER_ERROR', details);
  }

  /**
   * Not Implemented - 501
   */
  static notImplemented(message = 'Funcionalidad no implementada', details = null) {
    return new AppError(message, 501, 'NOT_IMPLEMENTED', details);
  }

  /**
   * Bad Gateway - 502
   */
  static badGateway(message = 'Error en el gateway', details = null) {
    return new AppError(message, 502, 'BAD_GATEWAY', details);
  }

  /**
   * Service Unavailable - 503
   */
  static serviceUnavailable(message = 'Servicio no disponible', details = null) {
    return new AppError(message, 503, 'SERVICE_UNAVAILABLE', details);
  }

  /**
   * Gateway Timeout - 504
   */
  static gatewayTimeout(message = 'Tiempo de espera del gateway agotado', details = null) {
    return new AppError(message, 504, 'GATEWAY_TIMEOUT', details);
  }

  // ========== Errores de Negocio Específicos ==========

  /**
   * Validation Error - 422
   */
  static validation(message = 'Error de validación', errors = []) {
    return new AppError(message, 422, 'VALIDATION_ERROR', errors);
  }

  /**
   * Database Error - 500
   */
  static database(message = 'Error de base de datos', details = null) {
    return new AppError(message, 500, 'DATABASE_ERROR', details);
  }

  /**
   * External Service Error - 502
   */
  static externalService(message = 'Error en servicio externo', details = null) {
    return new AppError(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }

  /**
   * Token Expired - 401
   */
  static tokenExpired(message = 'Token expirado', details = null) {
    return new AppError(message, 401, 'TOKEN_EXPIRED', details);
  }

  /**
   * Token Invalid - 401
   */
  static tokenInvalid(message = 'Token inválido', details = null) {
    return new AppError(message, 401, 'TOKEN_INVALID', details);
  }

  /**
   * Session Expired - 401
   */
  static sessionExpired(message = 'Sesión expirada', details = null) {
    return new AppError(message, 401, 'SESSION_EXPIRED', details);
  }

  /**
   * Duplicate Entry - 409
   */
  static duplicate(message = 'Entrada duplicada', details = null) {
    return new AppError(message, 409, 'DUPLICATE_ENTRY', details);
  }

  /**
   * Insufficient Permissions - 403
   */
  static insufficientPermissions(message = 'Permisos insuficientes', details = null) {
    return new AppError(message, 403, 'INSUFFICIENT_PERMISSIONS', details);
  }

  /**
   * Account Locked - 423
   */
  static accountLocked(message = 'Cuenta bloqueada', details = null) {
    return new AppError(message, 423, 'ACCOUNT_LOCKED', details);
  }

  /**
   * Account Suspended - 403
   */
  static accountSuspended(message = 'Cuenta suspendida', details = null) {
    return new AppError(message, 403, 'ACCOUNT_SUSPENDED', details);
  }

  /**
   * Email Not Verified - 403
   */
  static emailNotVerified(message = 'Email no verificado', details = null) {
    return new AppError(message, 403, 'EMAIL_NOT_VERIFIED', details);
  }

  /**
   * Insufficient Funds - 402
   */
  static insufficientFunds(message = 'Fondos insuficientes', details = null) {
    return new AppError(message, 402, 'INSUFFICIENT_FUNDS', details);
  }

  /**
   * Resource Exhausted - 429
   */
  static resourceExhausted(message = 'Recursos agotados', details = null) {
    return new AppError(message, 429, 'RESOURCE_EXHAUSTED', details);
  }
}

module.exports = AppError;
