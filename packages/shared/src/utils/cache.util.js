// shared/src/utils/cache.util.js
const NodeCache = require('node-cache');

/**
 * In-memory cache fallback (cuando Redis no está disponible)
 * 
 * ⚠️ NO usa logger en el constructor para evitar problemas de inicialización
 * El logger solo se usa cuando se llaman los métodos (lazy loading)
 */
class LocalCache {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 0, 
      checkperiod: 600,
      useClones: false 
    });
    
    // ✅ NO llamar logger aquí - causa problemas de inicialización
    // Se llamará en el primer uso (lazy initialization)
    this.loggerAvailable = false;
    this.loggerChecked = false;
  }

  /**
   * Verifica si el logger está disponible e inicializado
   * @private
   */
  _getLogger() {
    if (!this.loggerChecked) {
      try {
        const { logger } = require('./logger.util');
        // Intentar usar logger - si falla, no está inicializado
        if (logger && typeof logger.info === 'function') {
          this.loggerAvailable = true;
          this.loggerChecked = true;
          
          // Log inicial solo la primera vez que se detecta
          logger.info('Local cache initialized');
        }
      } catch (error) {
        // Logger no disponible aún
        this.loggerAvailable = false;
      }
    }

    if (this.loggerAvailable) {
      const { logger } = require('./logger.util');
      return logger;
    }
    
    return null;
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
      const logger = this._getLogger();
      if (logger) {
        logger.error('Error setting cache value', { key, error: error.message });
      } else {
        console.error('LocalCache SET error:', key, error.message);
      }
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
      const logger = this._getLogger();
      if (logger) {
        logger.error('Error getting cache value', { key, error: error.message });
      } else {
        console.error('LocalCache GET error:', key, error.message);
      }
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
      const logger = this._getLogger();
      if (logger) {
        logger.error('Error deleting cache key', { key, error: error.message });
      } else {
        console.error('LocalCache DEL error:', key, error.message);
      }
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
      const logger = this._getLogger();
      if (logger) {
        logger.error('Error checking cache existence', { key, error: error.message });
      } else {
        console.error('LocalCache EXISTS error:', key, error.message);
      }
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
      const logger = this._getLogger();
      if (logger) {
        logger.error('Error getting cache keys', { pattern, error: error.message });
      } else {
        console.error('LocalCache KEYS error:', pattern, error.message);
      }
      return [];
    }
  }

  /**
   * Clear all cache
   */
  flush() {
    try {
      this.cache.flushAll();
      const logger = this._getLogger();
      if (logger) {
        logger.info('Local cache flushed');
      }
      return true;
    } catch (error) {
      const logger = this._getLogger();
      if (logger) {
        logger.error('Error flushing cache', { error: error.message });
      } else {
        console.error('LocalCache FLUSH error:', error.message);
      }
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