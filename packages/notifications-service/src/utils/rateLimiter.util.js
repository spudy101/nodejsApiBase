'use strict';

const { logger } = require('@abundbank/shared');

/**
 * Utilidad para rate limiting genérico
 * Usa Redis para controlar límites de rate
 */
class RateLimiter {
  /**
   * Verifica y aplica rate limit
   * @param {Object} cache - Instancia de cache (Redis)
   * @param {string} service - Nombre del servicio ('sns', 'ses')
   * @param {number} limit - Límite de requests por minuto
   * @param {number} increment - Cantidad a incrementar (default: 1)
   * @returns {Promise<void>}
   */
  static async checkRateLimit(cache, service, limit, increment = 1) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `aws_${service}_rate:${minute}`;

    const current = await cache.get(key);
    const count = current ? parseInt(current) : 0;

    if (count >= limit) {
      const waitTime = 60000 - (now % 60000);
      logger.warn(`Rate limit ${service.toUpperCase()} alcanzado, esperando ${waitTime}ms`, {
        service,
        limit,
        current: count
      });
      await this.sleep(waitTime);
    }

    await cache.set(key, count + increment, 120); // TTL 2 minutos
  }

  /**
   * Verifica rate limit para SNS
   * @param {Object} cache
   * @param {number} batchSize - Tamaño del lote a enviar
   */
  static async checkSNSRateLimit(cache, batchSize = 100) {
    // Límite ejemplo: 300 mensajes por minuto
    await this.checkRateLimit(cache, 'sns', 300, batchSize);
  }

  /**
   * Verifica rate limit para SES
   * @param {Object} cache
   * @param {number} batchSize - Tamaño del lote a enviar
   */
  static async checkSESRateLimit(cache, batchSize = 50) {
    // Límite ejemplo: 200 emails por minuto
    await this.checkRateLimit(cache, 'ses', 200, batchSize);
  }

  /**
   * Obtiene el contador actual de rate limit
   * @param {Object} cache
   * @param {string} service
   * @returns {Promise<number>}
   */
  static async getCurrentCount(cache, service) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `aws_${service}_rate:${minute}`;

    const current = await cache.get(key);
    return current ? parseInt(current) : 0;
  }

  /**
   * Reinicia el contador de rate limit (útil para testing)
   * @param {Object} cache
   * @param {string} service
   */
  static async resetRateLimit(cache, service) {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `aws_${service}_rate:${minute}`;

    await cache.del(key);
    logger.info(`Rate limit ${service.toUpperCase()} reiniciado`);
  }

  /**
   * Sleep helper
   * @param {number} ms - Milisegundos a esperar
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Calcula delay óptimo entre requests para no exceder rate limit
   * @param {number} totalRequests - Total de requests a hacer
   * @param {number} limitPerMinute - Límite por minuto
   * @returns {number} Delay en ms entre cada request
   */
  static calculateOptimalDelay(totalRequests, limitPerMinute) {
    if (totalRequests <= limitPerMinute) {
      return 0; // No hay necesidad de delay
    }

    const totalTimeMs = Math.ceil(totalRequests / limitPerMinute) * 60000;
    return Math.ceil(totalTimeMs / totalRequests);
  }

  /**
   * Ejecuta una función con rate limiting automático
   * @param {Function} fn - Función a ejecutar
   * @param {Array} items - Items a procesar
   * @param {number} limitPerMinute - Límite por minuto
   * @returns {Promise<Array>} Resultados
   */
  static async executeWithRateLimit(fn, items, limitPerMinute) {
    const delay = this.calculateOptimalDelay(items.length, limitPerMinute);
    const results = [];

    for (let i = 0; i < items.length; i++) {
      const result = await fn(items[i]);
      results.push(result);

      if (delay > 0 && i < items.length - 1) {
        await this.sleep(delay);
      }
    }

    return results;
  }
}

module.exports = RateLimiter;
