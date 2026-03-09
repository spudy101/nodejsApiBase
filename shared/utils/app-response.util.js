// src/utils/response.util.js

'use strict';

const { HTTP_STATUS } = require('../constants');

/**
 * Clase centralizada para respuestas HTTP estandarizadas.
 * Toda respuesta de la API pasa por aquí.
 *
 * Estructura de respuesta exitosa:
 * { success: true, statusCode, message, data, metadata, timestamp }
 *
 * Estructura de respuesta de error:
 * { success: false, statusCode, message, errorCode?, errors?, timestamp }
 */
class ApiResponse {
  constructor(success, statusCode, message, data = null, metadata = null) {
    this.success   = success;
    this.statusCode = statusCode;
    this.message   = message;
    this.data      = data;
    this.metadata  = metadata;
    this.timestamp = new Date().toISOString();
  }

  // ==============================================
  // SUCCESS
  // ==============================================

  static success(res, message, data = null, statusCode = HTTP_STATUS.OK, metadata = null) {
    const response = new ApiResponse(true, statusCode, message, data, metadata);
    return res.status(statusCode).json(response);
  }

  static created(res, message, data = null, metadata = null) {
    return ApiResponse.success(res, message, data, HTTP_STATUS.CREATED, metadata);
  }

  static noContent(res) {
    return res.status(HTTP_STATUS.NO_CONTENT).send();
  }

  // ==============================================
  // ERRORS
  // ==============================================

  static error(res, message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR, errorCode = null, errors = null) {
    const response = new ApiResponse(false, statusCode, message);
    if (errorCode) response.errorCode = errorCode;
    if (errors)    response.errors    = errors;
    return res.status(statusCode).json(response);
  }

  static badRequest(res, message, errors = null) {
    return ApiResponse.error(res, message, HTTP_STATUS.BAD_REQUEST, 'BAD_REQUEST', errors);
  }

  static unauthorized(res, message = 'No autorizado') {
    return ApiResponse.error(res, message, HTTP_STATUS.UNAUTHORIZED, 'UNAUTHORIZED');
  }

  static forbidden(res, message = 'Acceso denegado') {
    return ApiResponse.error(res, message, HTTP_STATUS.FORBIDDEN, 'FORBIDDEN');
  }

  static notFound(res, message = 'Recurso no encontrado') {
    return ApiResponse.error(res, message, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }

  static conflict(res, message) {
    return ApiResponse.error(res, message, HTTP_STATUS.CONFLICT, 'CONFLICT');
  }

  static tooManyRequests(res, message = 'Demasiadas peticiones') {
    return ApiResponse.error(res, message, HTTP_STATUS.TOO_MANY_REQUESTS, 'RATE_LIMIT');
  }

  static validationError(res, errors) {
    return ApiResponse.error(
      res,
      'Error de validación',
      HTTP_STATUS.UNPROCESSABLE_ENTITY,
      'VALIDATION_ERROR',
      errors
    );
  }
}

module.exports = ApiResponse;