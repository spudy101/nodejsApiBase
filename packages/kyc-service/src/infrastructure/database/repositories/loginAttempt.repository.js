'use strict';

const { BaseRepository } = require('@abundbank/shared');
const { Op } = require('sequelize');

class LoginAttemptRepository extends BaseRepository {
  constructor(model, models) {
    super(model);
    this.models = models;
  }

  // ==================== INCLUDES REUTILIZABLES ====================

  /**
   * Include básico: Solo datos de la persona
   */
  getBasicInclude() {
    return [
      {
        model: this.models.Person,
        as: 'person',
        attributes: ['id', 'first_name', 'last_name', 'national_id'],
        include: [
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'username', 'cognito_username']
          }
        ]
      }
    ];
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Registra un intento de login
   * @param {Object} attemptData - Datos del intento
   * @returns {Promise<LoginAttempt>}
   */
  async recordAttempt(attemptData) {
    return await this.create({
      ...attemptData,
      attempted_at: new Date()
    });
  }

  /**
   * Cuenta intentos fallidos recientes de un usuario
   * @param {string} nationalId - National ID del usuario
   * @param {number} timeWindowMinutes - Ventana de tiempo en minutos (default: 15)
   * @returns {Promise<number>}
   */
  async countFailedAttempts(nationalId, timeWindowMinutes = 15) {
    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    return await this.count({
      national_id: nationalId,
      success: false,
      attempted_at: {
        [Op.gte]: timeThreshold
      }
    });
  }

  /**
   * Verifica si una cuenta está bloqueada
   * @param {string} nationalId - National ID del usuario
   * @returns {Promise<{blocked: boolean, remainingMinutes: number}|null>}
   */
  async checkIfBlocked(nationalId) {
    const latestAttempt = await this.findOne(
      {
        national_id: nationalId,
        blocked_until: {
          [Op.ne]: null
        }
      },
      {
        order: [['attempted_at', 'DESC']]
      }
    );

    if (!latestAttempt || !latestAttempt.blocked_until) {
      return null;
    }

    const now = new Date();
    const blockedUntil = new Date(latestAttempt.blocked_until);

    if (now < blockedUntil) {
      const remainingMs = blockedUntil - now;
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      return {
        blocked: true,
        remainingMinutes,
        blockedUntil
      };
    }

    return null;
  }

  /**
   * Limpia la cache key de sesión de un dispositivo específico
   * @param {string} userId - UUID del usuario
   * @param {string} deviceFingerprint - Fingerprint del dispositivo
   * @returns {Promise<number>} Número de registros actualizados
   */
  async clearSessionCacheKey(userId, deviceFingerprint) {
    return await this.bulkUpdate(
      { session_cache_key: null },
      {
        user_id: userId,
        device_fingerprint: deviceFingerprint
      }
    );
  }

  /**
   * Limpia todas las cache keys de sesión de un usuario
   * @param {string} userId - UUID del usuario
   * @returns {Promise<number>} Número de registros actualizados
   */
  async clearAllSessionCacheKeys(userId) {
    return await this.bulkUpdate(
      { session_cache_key: null },
      { user_id: userId }
    );
  }

  /**
   * Invalida sesiones previas del mismo dispositivo (excepto la actual)
   * @param {string} userId - UUID del usuario
   * @param {string} deviceFingerprint - Fingerprint del dispositivo
   * @param {string} currentAttemptId - ID del intento actual
   * @returns {Promise<number>} Número de registros actualizados
   */
  async invalidatePreviousDeviceSession(userId, deviceFingerprint, currentAttemptId) {
    return await this.bulkUpdate(
      { session_cache_key: null },
      {
        user_id: userId,
        device_fingerprint: deviceFingerprint,
        id: {
          [Op.ne]: currentAttemptId
        }
      }
    );
  }

  /**
   * Obtiene el historial de intentos de login de un usuario
   * @param {string} userId - UUID del usuario
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: LoginAttempt[], count: number}>}
   */
  async getLoginHistory(userId, paginationParams = {}) {
    const defaultParams = {
      limit: paginationParams.limit || 50,
      offset: paginationParams.offset || 0,
      sortBy: 'attempted_at',
      order: 'DESC'
    };

    return await this.findAllPaginated(
      { user_id: userId },
      defaultParams
    );
  }

  /**
   * Obtiene intentos fallidos recientes de un usuario
   * @param {string} nationalId - National ID
   * @param {number} limit - Límite de resultados
   * @returns {Promise<LoginAttempt[]>}
   */
  async getRecentFailedAttempts(nationalId, limit = 10) {
    return await this.findAll(
      {
        national_id: nationalId,
        success: false
      },
      {
        limit,
        order: [['attempted_at', 'DESC']]
      }
    );
  }

  /**
   * Obtiene intentos exitosos con sesiones activas
   * @param {string} userId - UUID del usuario
   * @returns {Promise<LoginAttempt[]>}
   */
  async getActiveSessionAttempts(userId) {
    return await this.findAll(
      {
        user_id: userId,
        success: true,
        session_cache_key: {
          [Op.ne]: null
        }
      },
      {
        order: [['attempted_at', 'DESC']]
      }
    );
  }

  /**
   * Cuenta intentos de login por IP en un período de tiempo
   * @param {string} ipAddress - Dirección IP
   * @param {number} timeWindowMinutes - Ventana de tiempo en minutos
   * @returns {Promise<number>}
   */
  async countAttemptsByIP(ipAddress, timeWindowMinutes = 15) {
    const timeThreshold = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    return await this.count({
      ip_address: ipAddress,
      attempted_at: {
        [Op.gte]: timeThreshold
      }
    });
  }

  /**
   * Obtiene estadísticas de intentos de login
   * @param {string} userId - UUID del usuario
   * @param {number} days - Número de días hacia atrás (default: 30)
   * @returns {Promise<Object>}
   */
  async getLoginStats(userId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalAttempts, successfulLogins, failedAttempts, uniqueDevices] = await Promise.all([
      this.count({
        user_id: userId,
        attempted_at: { [Op.gte]: startDate }
      }),
      this.count({
        user_id: userId,
        success: true,
        attempted_at: { [Op.gte]: startDate }
      }),
      this.count({
        user_id: userId,
        success: false,
        attempted_at: { [Op.gte]: startDate }
      }),
      this.model.count({
        where: {
          user_id: userId,
          attempted_at: { [Op.gte]: startDate }
        },
        distinct: true,
        col: 'device_fingerprint'
      })
    ]);

    return {
      totalAttempts,
      successfulLogins,
      failedAttempts,
      uniqueDevices,
      successRate: totalAttempts > 0 
        ? ((successfulLogins / totalAttempts) * 100).toFixed(2) 
        : 0
    };
  }

  /**
   * Limpia intentos antiguos (older than X days)
   * @param {number} daysToKeep - Días de retención
   * @returns {Promise<number>} Número de registros eliminados
   */
  async cleanOldAttempts(daysToKeep = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await this.bulkDelete({
      attempted_at: {
        [Op.lt]: cutoffDate
      },
      session_cache_key: null // Solo eliminar intentos sin sesiones activas
    });
  }

  /**
   * Obtiene el último intento exitoso de un usuario
   * @param {string} userId - UUID del usuario
   * @returns {Promise<LoginAttempt|null>}
   */
  async getLastSuccessfulLogin(userId) {
    return await this.findOne(
      {
        user_id: userId,
        success: true
      },
      {
        order: [['attempted_at', 'DESC']]
      }
    );
  }

  /**
   * Detecta intentos sospechosos (múltiples IPs o dispositivos)
   * @param {string} userId - UUID del usuario
   * @param {number} timeWindowHours - Ventana de tiempo en horas
   * @returns {Promise<Object>}
   */
  async detectSuspiciousActivity(userId, timeWindowHours = 24) {
    const timeThreshold = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

    const attempts = await this.findAll(
      {
        user_id: userId,
        attempted_at: { [Op.gte]: timeThreshold }
      },
      {
        attributes: ['ip_address', 'device_fingerprint', 'attempted_at', 'success'],
        order: [['attempted_at', 'DESC']]
      }
    );

    const uniqueIPs = new Set(attempts.map(a => a.ip_address));
    const uniqueDevices = new Set(attempts.map(a => a.device_fingerprint));

    return {
      suspicious: uniqueIPs.size > 3 || uniqueDevices.size > 3,
      uniqueIPs: uniqueIPs.size,
      uniqueDevices: uniqueDevices.size,
      totalAttempts: attempts.length,
      recentAttempts: attempts.slice(0, 5)
    };
  }
}

module.exports = LoginAttemptRepository;