// src/utils/cache.js
const NodeCache = require('node-cache');
const { logger } = require('./logger');

/**
 * In-memory cache fallback (cuando Redis no está disponible)
 */
class LocalCache {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 0, 
      checkperiod: 600,
      useClones: false 
    });
    
    logger.info('Local cache initialized');
  }

  /**
   * Set value with optional TTL
   * @param {string} key
   * @param {any} value
   * @param {number} ttl - Time to live in seconds
   */
  set(key, value, ttl = 0) {
    try {
      const success = this.cache.set(key, value, ttl);
      return success;
    } catch (error) {
      logger.error('Error setting cache value', { key, error: error.message });
      return false;
    }
  }

  /**
   * Get value
   * @param {string} key
   */
  get(key) {
    try {
      const value = this.cache.get(key);
      return value !== undefined ? value : null;
    } catch (error) {
      logger.error('Error getting cache value', { key, error: error.message });
      return null;
    }
  }

  /**
   * Delete key
   * @param {string} key
   * @returns {number} 1 si eliminó, 0 si no existía
   */
  del(key) {
    try {
      const deleted = this.cache.del(key);
      return deleted; // node-cache ya retorna el count
    } catch (error) {
      logger.error('Error deleting cache key', { key, error: error.message });
      return 0;
    }
  }

  /**
   * Check if key exists
   * @param {string} key
   */
  exists(key) {
    try {
      return this.cache.has(key) ? 1 : 0;
    } catch (error) {
      logger.error('Error checking cache existence', { key, error: error.message });
      return 0;
    }
  }

  /**
   * 🔥 Get keys matching pattern (simula Redis KEYS)
   * @param {string} pattern - Pattern con wildcards (ej: "user:*")
   * @returns {Array<string>} Array de keys que coinciden
   */
  keys(pattern) {
    try {
      const allKeys = this.cache.keys();
      
      // Convierte pattern de Redis a regex
      // user:* -> ^user:.*$
      // user:*:sessions -> ^user:.*:sessions$
      const regexPattern = '^' + pattern
        .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escapa caracteres especiales
        .replace(/\*/g, '.*') // * -> .*
        + '$';
      
      const regex = new RegExp(regexPattern);
      
      return allKeys.filter(key => regex.test(key));
    } catch (error) {
      logger.error('Error getting cache keys', { pattern, error: error.message });
      return [];
    }
  }

  /**
   * Clear all cache
   */
  flush() {
    try {
      this.cache.flushAll();
      logger.info('Local cache flushed');
      return true;
    } catch (error) {
      logger.error('Error flushing cache', { error: error.message });
      return false;
    }
  }

  /**
   * Get cache stats
   */
  getStats() {
    return this.cache.getStats();
  }
}

const localCache = new LocalCache();

module.exports = localCache;