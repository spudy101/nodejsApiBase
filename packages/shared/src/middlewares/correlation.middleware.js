'use strict';

const { v4: uuidv4 } = require('uuid');

/**
 * Middleware para agregar Correlation ID a cada request
 * 
 * El Correlation ID es un identificador único que permite trazar
 * una request completa a través de todos los logs y servicios.
 * 
 * Flujo:
 * 1. Si el cliente envía X-Correlation-Id, lo respetamos
 * 2. Si no, generamos uno nuevo
 * 3. Lo guardamos en req.correlationId
 * 4. Lo devolvemos en el header de respuesta
 * 
 * Beneficios:
 * - Debugging: Buscar todos los logs de una request específica
 * - Trazabilidad: Seguir el flujo end-to-end
 * - Soporte: El usuario puede reportar el correlationId si hay error
 */
class CorrelationMiddleware {
  /**
   * Agrega Correlation ID a la request
   * 
   * @example
   * // En app.js:
   * app.use(CorrelationMiddleware.addCorrelationId);
   * 
   * // En tus logs:
   * logger.info('Action performed', {
   *   correlationId: req.correlationId,
   *   userId: req.user.userId
   * });
   * 
   * // En el frontend (cuando hay error):
   * const correlationId = response.headers.get('X-Correlation-Id');
   * alert(`Error. Código de referencia: ${correlationId}`);
   */
  static addCorrelationId(req, res, next) {
    // Prioridad:
    // 1. X-Correlation-Id (estándar recomendado)
    // 2. X-Request-Id (alternativo usado por algunos servicios)
    // 3. Generar nuevo
    const correlationId = 
      req.headers['x-correlation-id'] || 
      req.headers['x-request-id'] ||
      CorrelationMiddleware._generateId();

    // Guardar en request para que todos los middlewares/controllers lo usen
    req.correlationId = correlationId;

    // Devolver en response header (útil para debugging del frontend)
    res.setHeader('X-Correlation-Id', correlationId);

    next();
  }

  /**
   * Genera un Correlation ID único
   * Formato: req-{timestamp}-{uuid-corto}
   * 
   * @returns {string} Correlation ID
   * @private
   */
  static _generateId() {
    // Formato: req-1737575485123-a1b2c3d4
    // - req: Prefijo para identificar requests
    // - timestamp: Facilita búsqueda por tiempo
    // - uuid corto: Garantiza unicidad
    return `req-${Date.now()}-${uuidv4().slice(0, 8)}`;
  }

  /**
   * Obtiene headers para propagar el Correlation ID a servicios externos
   * Útil cuando llamas a microservicios u APIs externas
   * 
   * @param {Object} req - Express request object
   * @returns {Object} Headers con Correlation ID
   * 
   * @example
   * // En un servicio que llama a API externa:
   * const headers = CorrelationMiddleware.getPropagationHeaders(req);
   * 
   * const response = await axios.post('https://external-api.com', data, {
   *   headers: {
   *     ...headers,
   *     'Content-Type': 'application/json'
   *   }
   * });
   */
  static getPropagationHeaders(req) {
    return {
      'X-Correlation-Id': req.correlationId,
      'X-Request-Id': req.correlationId, // Algunos servicios usan este nombre
    };
  }
}

module.exports = CorrelationMiddleware;