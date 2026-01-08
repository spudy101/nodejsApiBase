// src/utils/jwt.js
const jwt = require('jsonwebtoken');
const EncryptionUtil = require('./encryption'); // 🔥 Usa EncryptionUtil
const { JWT, REDIS_KEYS, REDIS_TTL } = require('../constants');
const redisClient = require('./redis');
const localCache = require('./cache');
const { logger } = require('./logger');

class JWTUtil {
  static getCache() {
    return redisClient.isAvailable() ? redisClient : localCache;
  }

  static generateAccessToken(payload) {
    return jwt.sign(
      { ...payload, jti: EncryptionUtil.generateRandomString(16) }, // 🔥 Usa EncryptionUtil
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: JWT.ACCESS_TOKEN_EXPIRY,
        issuer: JWT.ISSUER,
        audience: JWT.AUDIENCE
      }
    );
  }

  static generateRefreshToken(payload) {
    return jwt.sign(
      { ...payload, jti: EncryptionUtil.generateRandomString(16) }, // 🔥 Usa EncryptionUtil
      process.env.JWT_REFRESH_SECRET,
      {
        expiresIn: JWT.REFRESH_TOKEN_EXPIRY,
        issuer: JWT.ISSUER,
        audience: JWT.AUDIENCE
      }
    );
  }

  /**
   * Generate token pair
   * @param {Object} user - Usuario
   * @param {string} deviceFingerprint - Fingerprint del dispositivo (opcional)
   * @param {Object} deviceMetadata - Metadata del dispositivo (opcional)
   */
  static async generateTokenPair(user, deviceFingerprint = null, deviceMetadata = null) {
    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    const decoded = jwt.decode(refreshToken);
    
    const sessionId = deviceFingerprint || decoded.jti;
    const key = `${REDIS_KEYS.REFRESH_TOKEN}${user.id}:${sessionId}`;
    
    // 🔥 Guarda el token junto con metadata si está disponible
    const sessionData = {
      token: refreshToken,
      createdAt: new Date().toISOString(),
      ...(deviceMetadata && { metadata: deviceMetadata })
    };
    
    await this.getCache().set(key, JSON.stringify(sessionData), REDIS_TTL.REFRESH_TOKEN);
    
    logger.debug('Token pair generated', { 
      userId: user.id, 
      sessionId: deviceFingerprint ? 'device-based' : 'jti-based'
    });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
      issuer: JWT.ISSUER,
      audience: JWT.AUDIENCE
    });
  }

  static verifyRefreshToken(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      issuer: JWT.ISSUER,
      audience: JWT.AUDIENCE
    });
  }

  static async blacklistToken(token) {
    const decoded = jwt.decode(token);
    if (!decoded) return false;

    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    if (expiresIn <= 0) return false;

    const key = `${REDIS_KEYS.BLACKLIST_TOKEN}${decoded.jti}`;
    await this.getCache().set(key, 'blacklisted', expiresIn);
    return true;
  }

  static async isTokenBlacklisted(token) {
    const decoded = jwt.decode(token);
    if (!decoded) return false;
    
    const key = `${REDIS_KEYS.BLACKLIST_TOKEN}${decoded.jti}`;
    return await this.getCache().exists(key);
  }

  /**
   * Invalidate refresh token
   * @param {string} token - Refresh token a invalidar
   * @param {string} deviceFingerprint - Fingerprint del dispositivo (opcional)
   */
  static async invalidateRefreshToken(token, deviceFingerprint = null) {
    const decoded = jwt.decode(token);
    if (!decoded) return false;

    const sessionId = deviceFingerprint || decoded.jti;
    const key = `${REDIS_KEYS.REFRESH_TOKEN}${decoded.id}:${sessionId}`;
    
    const deleted = await this.getCache().del(key);
    
    if (deleted) {
      logger.debug('Refresh token invalidated', { 
        userId: decoded.id, 
        sessionId 
      });
    }
    
    return deleted > 0;
  }

  /**
   * Verify stored refresh token
   * @param {string} token - Refresh token a verificar
   * @param {string} deviceFingerprint - Fingerprint del dispositivo (opcional)
   */
  static async verifyStoredRefreshToken(token, deviceFingerprint = null) {
    const decoded = jwt.decode(token);
    if (!decoded) return false;

    const sessionId = deviceFingerprint || decoded.jti;
    const key = `${REDIS_KEYS.REFRESH_TOKEN}${decoded.id}:${sessionId}`;
    const storedData = await this.getCache().get(key);
    
    if (!storedData) return false;

    try {
      const sessionData = JSON.parse(storedData);
      return sessionData.token === token;
    } catch (error) {
      // Retrocompatibilidad: si no es JSON, compara directo
      return storedData === token;
    }
  }

  /**
   * Get all active sessions for a user
   * @param {string} userId - ID del usuario
   * @returns {Array} Array de sesiones activas con metadata
   */
  static async getActiveSessions(userId) {
    const pattern = `${REDIS_KEYS.REFRESH_TOKEN}${userId}:*`;
    const keys = await this.getCache().keys(pattern);
    
    const sessions = [];
    
    for (const key of keys) {
      const sessionId = key.split(':').pop();
      const storedData = await this.getCache().get(key);
      
      if (!storedData) continue;

      try {
        const sessionData = JSON.parse(storedData);
        const decoded = jwt.decode(sessionData.token);
        
        sessions.push({
          sessionId,
          createdAt: sessionData.createdAt,
          expiresAt: new Date(decoded.exp * 1000).toISOString(),
          metadata: sessionData.metadata || null,
          isCurrent: false // Se marca en el service
        });
      } catch (error) {
        // Retrocompatibilidad: sesiones sin metadata
        const decoded = jwt.decode(storedData);
        if (decoded) {
          sessions.push({
            sessionId,
            createdAt: null,
            expiresAt: new Date(decoded.exp * 1000).toISOString(),
            metadata: null,
            isCurrent: false
          });
        }
      }
    }
    
    return sessions;
  }

  /**
   * Invalidate specific session
   * @param {string} userId - ID del usuario
   * @param {string} sessionId - ID de la sesión a invalidar
   */
  static async invalidateSession(userId, sessionId) {
    const key = `${REDIS_KEYS.REFRESH_TOKEN}${userId}:${sessionId}`;
    const deleted = await this.getCache().del(key);
    
    if (deleted) {
      logger.info('Session invalidated', { userId, sessionId });
    }
    
    return deleted > 0;
  }

  /**
   * Invalidate all sessions for a user (útil para "logout everywhere")
   * @param {string} userId - ID del usuario
   */
  static async invalidateAllSessions(userId) {
    const sessions = await this.getActiveSessions(userId);
    
    for (const session of sessions) {
      const key = `${REDIS_KEYS.REFRESH_TOKEN}${userId}:${session.sessionId}`;
      await this.getCache().del(key);
    }
    
    logger.info('All sessions invalidated', { userId, count: sessions.length });
    
    return sessions.length;
  }
}

module.exports = JWTUtil;