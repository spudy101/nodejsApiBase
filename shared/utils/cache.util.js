// src/utils/cache.util.js

'use strict';

const NodeCache = require('node-cache');
const { logger } = require('./logger.util');

/**
 * Caché en memoria local.
 * Se usa como fallback cuando Redis no está disponible.
 * La API es intencionalmente compatible con redis.util.js.
 */
class LocalCache {
  constructor() {
    this.cache = new NodeCache({
      stdTTL:      0,    // Sin TTL por defecto (se pasa en cada set)
      checkperiod: 600,  // Limpieza automática cada 10 minutos
      useClones:   false,
    });
  }

  /**
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Segundos (0 = sin expiración)
   * @returns {boolean}
   */
  set(key, value, ttl = 0) {
    try {
      return this.cache.set(key, value, ttl);
    } catch (error) {
      logger.error('LocalCache SET error', { key, error: error.message });
      return false;
    }
  }

  /**
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    try {
      const value = this.cache.get(key);
      return value !== undefined ? value : null;
    } catch (error) {
      logger.error('LocalCache GET error', { key, error: error.message });
      return null;
    }
  }

  /**
   * @param {string} key
   * @returns {number} Cantidad de keys eliminadas
   */
  del(key) {
    try {
      return this.cache.del(key);
    } catch (error) {
      logger.error('LocalCache DEL error', { key, error: error.message });
      return 0;
    }
  }

  /**
   * @param {string} key
   * @returns {number} 1 si existe, 0 si no
   */
  exists(key) {
    try {
      return this.cache.has(key) ? 1 : 0;
    } catch (error) {
      logger.error('LocalCache EXISTS error', { key, error: error.message });
      return 0;
    }
  }

  /**
   * Busca keys que coincidan con un patrón estilo Redis (soporta wildcard *).
   * @param {string} pattern - Ej: "lock:user:*"
   * @returns {string[]}
   */
  keys(pattern) {
    try {
      const allKeys = this.cache.keys();
      const regex   = new RegExp(
        '^' + pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$'
      );
      return allKeys.filter((key) => regex.test(key));
    } catch (error) {
      logger.error('LocalCache KEYS error', { pattern, error: error.message });
      return [];
    }
  }

  /**
   * Elimina todo el caché en memoria.
   * @returns {boolean}
   */
  flush() {
    try {
      this.cache.flushAll();
      logger.info('LocalCache flushed');
      return true;
    } catch (error) {
      logger.error('LocalCache FLUSH error', { error: error.message });
      return false;
    }
  }

  /** @returns {object} Estadísticas internas de node-cache */
  getStats() {
    return this.cache.getStats();
  }
}

module.exports = new LocalCache();