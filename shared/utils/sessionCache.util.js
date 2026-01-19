// src/utils/sessionCache.util.js
'use strict';

const redisClient = require('./redis.util');
const localCache = require('./cache.util');
const { logger } = require('./logger.util');

class SessionCacheUtil {
  /**
   * Get cache client (Redis if available, otherwise local)
   */
  static getCache() {
    return redisClient.isAvailable() ? redisClient : localCache;
  }

  /**
   * Generate session cache key
   */
  static generateSessionKey(userId, deviceFingerprint) {
    return `session:${userId}:${deviceFingerprint}`;
  }

  /**
   * Store session tokens in cache
   * @param {string} userId - User ID
   * @param {string} deviceFingerprint - Device fingerprint
   * @param {Object} tokens - Cognito tokens
   * @param {number} expiresIn - TTL in seconds (default: 3600 = 1 hour)
   * @returns {Promise<string>} - Cache key
   */
  static async storeSession(userId, deviceFingerprint, tokens, expiresIn = 3600) {
    const cache = this.getCache();
    const cacheKey = this.generateSessionKey(userId, deviceFingerprint);

    const sessionData = {
      userId,
      deviceFingerprint,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      expiresIn: tokens.expiresIn,
      createdAt: new Date().toISOString(),
    };

    try {
      await cache.set(cacheKey, sessionData, expiresIn);
      logger.info('Session stored', { userId, deviceFingerprint });
      return cacheKey;
    } catch (error) {
      logger.error('Error storing session', {
        userId,
        deviceFingerprint,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get session from cache
   * @param {string} userId - User ID
   * @param {string} deviceFingerprint - Device fingerprint
   * @returns {Promise<Object|null>} - Session data or null
   */
  static async getSession(userId, deviceFingerprint) {
    const cache = this.getCache();
    const cacheKey = this.generateSessionKey(userId, deviceFingerprint);

    try {
      const sessionData = await cache.get(cacheKey);
      return sessionData;
    } catch (error) {
      logger.error('Error retrieving session', {
        userId,
        deviceFingerprint,
        error: error.message,
      });
      return null;
    }
  }

  /**
   * Delete session from cache (logout)
   * @param {string} userId - User ID
   * @param {string} deviceFingerprint - Device fingerprint
   * @returns {Promise<boolean>}
   */
  static async deleteSession(userId, deviceFingerprint) {
    const cache = this.getCache();
    const cacheKey = this.generateSessionKey(userId, deviceFingerprint);

    try {
      await cache.del(cacheKey);
      logger.info('Session deleted', { userId, deviceFingerprint });
      return true;
    } catch (error) {
      logger.error('Error deleting session', {
        userId,
        deviceFingerprint,
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Delete all sessions for a user (logout all devices)
   * @param {string} userId - User ID
   * @returns {Promise<number>} - Number of deleted sessions
   */
  static async deleteAllUserSessions(userId) {
    const cache = this.getCache();
    const pattern = `session:${userId}:*`;

    try {
      if (redisClient.isAvailable()) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
          logger.info('All user sessions deleted', { userId, count: keys.length });
          return keys.length;
        }
        return 0;
      }

      // Local cache: iterate and delete
      let count = 0;
      const allKeys = Array.from(localCache.keys());
      for (const key of allKeys) {
        if (key.startsWith(`session:${userId}:`)) {
          await localCache.del(key);
          count++;
        }
      }

      if (count > 0) {
        logger.info('All user sessions deleted', { userId, count });
      }

      return count;
    } catch (error) {
      logger.error('Error deleting all user sessions', {
        userId,
        error: error.message,
      });
      return 0;
    }
  }

  /**
   * Check if session exists and is valid
   * @param {string} userId - User ID
   * @param {string} deviceFingerprint - Device fingerprint
   * @returns {Promise<boolean>}
   */
  static async sessionExists(userId, deviceFingerprint) {
    const session = await this.getSession(userId, deviceFingerprint);
    return session !== null;
  }

  /**
   * Update session last activity (refresh TTL)
   * @param {string} userId - User ID
   * @param {string} deviceFingerprint - Device fingerprint
   * @param {number} expiresIn - New TTL in seconds
   * @returns {Promise<boolean>}
   */
  static async touchSession(userId, deviceFingerprint, expiresIn = 3600) {
    const cache = this.getCache();
    const cacheKey = this.generateSessionKey(userId, deviceFingerprint);

    try {
      const sessionData = await cache.get(cacheKey);

      if (!sessionData) {
        return false;
      }

      await cache.set(cacheKey, sessionData, expiresIn);
      return true;
    } catch (error) {
      logger.error('Error refreshing session TTL', {
        userId,
        deviceFingerprint,
        error: error.message,
      });
      return false;
    }
  }
}

module.exports = SessionCacheUtil;