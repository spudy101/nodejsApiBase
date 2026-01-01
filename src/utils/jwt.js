// src/utils/jwt.js
const jwt = require('jsonwebtoken');
const { JWT, REDIS_KEYS, REDIS_TTL } = require('../constants');
const redisClient = require('./redis');
const { logger } = require('./logger');

class JWTUtil {
  /**
   * Generate access token
   */
  static generateAccessToken(payload) {
    try {
      return jwt.sign(
        payload,
        process.env.JWT_ACCESS_SECRET,
        {
          expiresIn: JWT.ACCESS_TOKEN_EXPIRY,
          issuer: JWT.ISSUER,
          audience: JWT.AUDIENCE
        }
      );
    } catch (error) {
      logger.error('Error generating access token', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(payload) {
    try {
      return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        {
          expiresIn: JWT.REFRESH_TOKEN_EXPIRY,
          issuer: JWT.ISSUER,
          audience: JWT.AUDIENCE
        }
      );
    } catch (error) {
      logger.error('Error generating refresh token', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate token pair
   */
  static async generateTokenPair(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);

    // 🔥 Store refresh token in Redis (optional)
    if (redisClient.isAvailable()) {
      const key = `${REDIS_KEYS.REFRESH_TOKEN}${user.id}`;
      const saved = await redisClient.set(key, refreshToken, REDIS_TTL.REFRESH_TOKEN);
      
      if (!saved) {
        logger.warn('Failed to cache refresh token in Redis', { userId: user.id });
      }
    } else {
      logger.debug('Refresh token not cached (Redis unavailable)', { userId: user.id });
    }

    return { accessToken, refreshToken };
  }

  /**
   * Verify access token
   */
  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_ACCESS_SECRET, {
        issuer: JWT.ISSUER,
        audience: JWT.AUDIENCE
      });
    } catch (error) {
      logger.error('Error verifying access token', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify refresh token
   */
  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
        issuer: JWT.ISSUER,
        audience: JWT.AUDIENCE
      });
    } catch (error) {
      logger.error('Error verifying refresh token', { error: error.message });
      throw error;
    }
  }

  /**
   * Decode token without verification
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      logger.error('Error decoding token', { error: error.message });
      return null;
    }
  }

  /**
   * Blacklist token (for logout)
   */
  static async blacklistToken(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded) return false;

      // 🔥 Sin Redis, no podemos blacklist (security warning)
      if (!redisClient.isAvailable()) {
        logger.warn('⚠️  SECURITY: Cannot blacklist token (Redis unavailable)', {
          userId: decoded.id
        });
        return false;
      }

      const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
      if (expiresIn > 0) {
        const key = `${REDIS_KEYS.BLACKLIST_TOKEN}${token}`;
        await redisClient.set(key, 'blacklisted', expiresIn);
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error blacklisting token', { error: error.message });
      return false;
    }
  }

  /**
   * Check if token is blacklisted
   */
  static async isTokenBlacklisted(token) {
    try {
      // 🔥 Sin Redis, no podemos verificar blacklist
      if (!redisClient.isAvailable()) {
        return false;
      }

      const key = `${REDIS_KEYS.BLACKLIST_TOKEN}${token}`;
      const exists = await redisClient.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Error checking token blacklist', { error: error.message });
      return false;
    }
  }

  /**
   * Invalidate refresh token
   */
  static async invalidateRefreshToken(userId) {
    try {
      // 🔥 Sin Redis, no podemos invalidar
      if (!redisClient.isAvailable()) {
        logger.warn('Cannot invalidate refresh token (Redis unavailable)', { userId });
        return false;
      }

      const key = `${REDIS_KEYS.REFRESH_TOKEN}${userId}`;
      await redisClient.del(key);
      return true;
    } catch (error) {
      logger.error('Error invalidating refresh token', { error: error.message });
      return false;
    }
  }

  /**
   * Verify stored refresh token
   */
  static async verifyStoredRefreshToken(userId, token) {
    try {
      // 🔥 Sin Redis, solo verificamos la firma JWT
      if (!redisClient.isAvailable()) {
        logger.debug('Skipping Redis token verification (unavailable)', { userId });
        return true; // Confiamos en la firma JWT
      }

      const key = `${REDIS_KEYS.REFRESH_TOKEN}${userId}`;
      const storedToken = await redisClient.get(key);
      
      // Si no hay token en Redis, aceptamos (puede haber expirado el cache)
      if (!storedToken) {
        logger.debug('No cached refresh token found', { userId });
        return true;
      }
      
      return storedToken === token;
    } catch (error) {
      logger.error('Error verifying stored refresh token', { error: error.message });
      return true; // En caso de error, confiamos en JWT
    }
  }
}

module.exports = JWTUtil;