'use strict';

const BaseRepository = require('./base.repository');
const { UserLoginAttempt } = require('../models');
const { Op } = require('sequelize');

class UserLoginAttemptRepository extends BaseRepository {
  constructor() {
    super(UserLoginAttempt);
  }

  static TIMEFRAMES = {
    BLOCK_WINDOW: 15, // minutos
    CLEANUP_DAYS: 90
  };

  async recordAttempt(attemptData, options = {}) {
    return await this.create({
      ...attemptData,
      attempted_at: new Date(),
    }, options);
  }

  /**
   * ✅ CORREGIDO: Verifica si cuenta está bloqueada por national_id
   * Retorna null si no está bloqueada, o { blocked, blockedUntil, remainingMinutes }
   */
  async checkIfBlocked(nationalId) {
    const lastAttempt = await this.findOne(
      { national_id: nationalId },
      { order: [['attempted_at', 'DESC']] }
    );

    if (!lastAttempt?.blocked_until) return null;

    const now = new Date();
    const blockedUntil = new Date(lastAttempt.blocked_until);

    if (blockedUntil > now) {
      return {
        blocked: true,
        blockedUntil,
        remainingMinutes: Math.ceil((blockedUntil - now) / 60000)
      };
    }

    return null;
  }

  /**
   * ✅ CORREGIDO: Cuenta intentos fallidos por national_id desde el último login exitoso
   */
  async countFailedAttempts(nationalId, minutes = UserLoginAttemptRepository.TIMEFRAMES.BLOCK_WINDOW) {
    const timeThreshold = new Date(Date.now() - minutes * 60000);

    const lastSuccess = await this.findOne(
      {
        national_id: nationalId,
        success: true,
        attempted_at: { [Op.gte]: timeThreshold }
      },
      { order: [['attempted_at', 'DESC']] }
    );

    const countFrom = lastSuccess ? lastSuccess.attempted_at : timeThreshold;

    return await this.count({
      national_id: nationalId,
      success: false,
      attempted_at: { [Op.gt]: countFrom }
    });
  }

  /**
   * Obtiene último login exitoso
   */
  async getLastSuccessfulLogin(userId) {
    return await this.findOne(
      { user_id: userId, success: true },
      { order: [['attempted_at', 'DESC']] }
    );
  }

  /**
   * Invalida sesiones previas del mismo dispositivo
   */
  async invalidatePreviousDeviceSession(userId, deviceFingerprint, currentAttemptId) {
    return await this.bulkUpdate(
      {
        session_cache_key: null,
        failure_reason: 'Nueva sesión iniciada en mismo dispositivo'
      },
      {
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        success: true,
        session_cache_key: { [Op.ne]: null },
        user_login_attempt_id: { [Op.ne]: currentAttemptId }
      }
    );
  }

  /**
   * Limpia session_cache_key para un dispositivo específico
   */
  async clearSessionCacheKey(userId, deviceFingerprint) {
    return await this.bulkUpdate(
      { session_cache_key: null },
      {
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        success: true,
        session_cache_key: { [Op.ne]: null }
      }
    );
  }

  /**
   * Limpia todos los session_cache_key del usuario
   */
  async clearAllSessionCacheKeys(userId) {
    return await this.bulkUpdate(
      { session_cache_key: null },
      {
        user_id: userId,
        success: true,
        session_cache_key: { [Op.ne]: null }
      }
    );
  }

  /**
   * Cleanup job: elimina intentos antiguos
   */
  async deleteOldAttempts(days = UserLoginAttemptRepository.TIMEFRAMES.CLEANUP_DAYS) {
    const threshold = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return await this.bulkDelete({ attempted_at: { [Op.lt]: threshold } });
  }
}

module.exports = new UserLoginAttemptRepository();