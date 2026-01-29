// shared/src/utils/response.util.js

// Este archivo está bien y NO necesita cambios porque usa shared/src/constants
// que ahora solo contiene constantes fijas (HTTP_STATUS, etc.)

const { HTTP_STATUS } = require('../constants');

class ApiResponse {
  constructor(success, statusCode, message, data = null, metadata = null) {
    this.success = success;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.metadata = metadata;
    this.timestamp = new Date().toISOString();
  }

  // ========== Success Responses ==========

  /**
   * Generic success response - 200
   */
  static success(res, message, data = null, statusCode = HTTP_STATUS.OK, metadata = null) {
    const response = new ApiResponse(true, statusCode, message, data, metadata);
    return res.status(statusCode).json(response);
  }

  /**
   * Created - 201
   */
  static created(res, message, data = null, metadata = null) {
    return this.success(res, message, data, HTTP_STATUS.CREATED, metadata);
  }

  /**
   * Accepted (async processing) - 202
   */
  static accepted(res, message = 'Solicitud aceptada para procesamiento', data = null, metadata = null) {
    return this.success(res, message, data, 202, metadata);
  }

  /**
   * No Content - 204
   */
  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  // ========== Error Responses ==========

  /**
   * Generic error response
   */
  static error(res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = null, errors = null) {
    const response = new ApiResponse(false, statusCode, message);
    if (errorCode) response.errorCode = errorCode;
    if (errors) response.errors = errors;
    return res.status(statusCode).json(response);
  }

  /**
   * Bad Request - 400
   */
  static badRequest(res, message, errors = null) {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', errors);
  }

  /**
   * Unauthorized - 401
   */
  static unauthorized(res, message = 'No autorizado') {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
  }

  /**
   * Forbidden - 403
   */
  static forbidden(res, message = 'Acceso denegado') {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }

  /**
   * Not Found - 404
   */
  static notFound(res, message = 'Recurso no encontrado') {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }

  /**
   * Method Not Allowed - 405
   */
  static methodNotAllowed(res, message = 'Método no permitido') {
    return this.error(res, message, 405, 'METHOD_NOT_ALLOWED');
  }

  /**
   * Not Acceptable - 406
   */
  static notAcceptable(res, message = 'Formato no aceptable') {
    return this.error(res, message, 406, 'NOT_ACCEPTABLE');
  }

  /**
   * Request Timeout - 408
   */
  static requestTimeout(res, message = 'Tiempo de espera agotado') {
    return this.error(res, message, 408, 'REQUEST_TIMEOUT');
  }

  /**
   * Conflict - 409
   */
  static conflict(res, message) {
    return this.error(res, message, HTTP_STATUS.CONFLICT, 'CONFLICT');
  }

  /**
   * Gone - 410
   */
  static gone(res, message = 'Recurso ya no disponible') {
    return this.error(res, message, 410, 'GONE');
  }

  /**
   * Precondition Failed - 412
   */
  static preconditionFailed(res, message = 'Precondición fallida') {
    return this.error(res, message, 412, 'PRECONDITION_FAILED');
  }

  /**
   * Payload Too Large - 413
   */
  static payloadTooLarge(res, message = 'Carga útil demasiado grande') {
    return this.error(res, message, 413, 'PAYLOAD_TOO_LARGE');
  }

  /**
   * Unsupported Media Type - 415
   */
  static unsupportedMediaType(res, message = 'Tipo de contenido no soportado') {
    return this.error(res, message, 415, 'UNSUPPORTED_MEDIA_TYPE');
  }

  /**
   * Unprocessable Entity - 422
   */
  static unprocessableEntity(res, message, errors = null) {
    return this.error(res, message, HTTP_STATUS.UNPROCESSABLE_ENTITY, 'UNPROCESSABLE_ENTITY', errors);
  }

  /**
   * Validation Error - 422 (alias)
   */
  static validationError(res, errors) {
    return this.error(res, 'Error de validación', HTTP_STATUS.UNPROCESSABLE_ENTITY, 'VALIDATION_ERROR', errors);
  }

  /**
   * Locked - 423
   */
  static locked(res, message = 'Recurso bloqueado') {
    return this.error(res, message, 423, 'LOCKED');
  }

  /**
   * Too Many Requests - 429
   */
  static tooManyRequests(res, message = 'Demasiadas peticiones') {
    return this.error(res, message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT');
  }

  /**
   * Internal Server Error - 500
   */
  static internalError(res, message = 'Error interno del servidor') {
    return this.error(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'INTERNAL_ERROR');
  }

  /**
   * Not Implemented - 501
   */
  static notImplemented(res, message = 'Funcionalidad no implementada') {
    return this.error(res, message, 501, 'NOT_IMPLEMENTED');
  }

  /**
   * Bad Gateway - 502
   */
  static badGateway(res, message = 'Error en el gateway') {
    return this.error(res, message, 502, 'BAD_GATEWAY');
  }

  /**
   * Service Unavailable - 503
   */
  static serviceUnavailable(res, message = 'Servicio no disponible') {
    return this.error(res, message, HTTP_STATUS.SERVICE_UNAVAILABLE, 'SERVICE_UNAVAILABLE');
  }

  /**
   * Gateway Timeout - 504
   */
  static gatewayTimeout(res, message = 'Tiempo de espera del gateway agotado') {
    return this.error(res, message, 504, 'GATEWAY_TIMEOUT');
  }

  // ========== Business Logic Error Responses ==========

  /**
   * Token Expired - 401
   */
  static tokenExpired(res, message = 'Token expirado') {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED, 'TOKEN_EXPIRED');
  }

  /**
   * Token Invalid - 401
   */
  static tokenInvalid(res, message = 'Token inválido') {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED, 'TOKEN_INVALID');
  }

  /**
   * Session Expired - 401
   */
  static sessionExpired(res, message = 'Sesión expirada') {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED, 'SESSION_EXPIRED');
  }

  /**
   * Duplicate Entry - 409
   */
  static duplicateEntry(res, message = 'Entrada duplicada') {
    return this.error(res, message, HTTP_STATUS.CONFLICT, 'DUPLICATE_ENTRY');
  }

  /**
   * Insufficient Permissions - 403
   */
  static insufficientPermissions(res, message = 'Permisos insuficientes') {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN, 'INSUFFICIENT_PERMISSIONS');
  }

  /**
   * Account Locked - 423
   */
  static accountLocked(res, message = 'Cuenta bloqueada') {
    return this.error(res, message, 423, 'ACCOUNT_LOCKED');
  }

  /**
   * Account Suspended - 403
   */
  static accountSuspended(res, message = 'Cuenta suspendida') {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN, 'ACCOUNT_SUSPENDED');
  }

  /**
   * Email Not Verified - 403
   */
  static emailNotVerified(res, message = 'Email no verificado') {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN, 'EMAIL_NOT_VERIFIED');
  }

  /**
   * Insufficient Funds - 402
   */
  static insufficientFunds(res, message = 'Fondos insuficientes') {
    return this.error(res, message, 402, 'INSUFFICIENT_FUNDS');
  }

  /**
   * Database Error - 500
   */
  static databaseError(res, message = 'Error de base de datos') {
    return this.error(res, message, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'DATABASE_ERROR');
  }

  /**
   * External Service Error - 502
   */
  static externalServiceError(res, message = 'Error en servicio externo') {
    return this.error(res, message, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

module.exports = ApiResponse;