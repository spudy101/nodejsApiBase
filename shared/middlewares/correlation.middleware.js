// src/middlewares/correlation.middleware.js

'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Agrega un Correlation ID único a cada request.
 *
 * Permite trazar una request a través de todos los logs y servicios.
 * Si el cliente envía X-Correlation-Id o X-Request-Id, se respeta.
 * Si no, se genera uno nuevo con formato: req-{timestamp}-{uuid-corto}
 *
 * El ID se devuelve en el header X-Correlation-Id de la respuesta
 * para que el frontend pueda reportarlo en caso de error.
 */
class CorrelationMiddleware {
  /**
   * Middleware principal — agregar al inicio del pipeline en app.js.
   */
  static addCorrelationId(req, res, next) {
    const correlationId =
      req.headers['x-correlation-id'] ||
      req.headers['x-request-id']     ||
      CorrelationMiddleware._generateId();

    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);

    next();
  }

  /**
   * Retorna los headers necesarios para propagar el Correlation ID
   * cuando se llama a un servicio externo o microservicio.
   *
   * @param {import('express').Request} req
   * @returns {{ 'X-Correlation-Id': string, 'X-Request-Id': string }}
   *
   * @example
   * const headers = CorrelationMiddleware.getPropagationHeaders(req);
   * await axios.post('https://otro-servicio.com/endpoint', data, { headers });
   */
  static getPropagationHeaders(req) {
    return {
      'X-Correlation-Id': req.correlationId,
      'X-Request-Id':     req.correlationId,
    };
  }

  /**
   * @returns {string} req-{timestamp}-{uuid-corto}
   * @private
   */
  static _generateId() {
    return `req-${Date.now()}-${uuidv4().slice(0, 8)}`;
  }
}

module.exports = CorrelationMiddleware;