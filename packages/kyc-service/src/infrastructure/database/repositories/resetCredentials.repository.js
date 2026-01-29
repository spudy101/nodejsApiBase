'use strict';

const { BaseRepository } = require('@abundbank/shared');
const { Op } = require('sequelize');

class ResetCredentialsRepository extends BaseRepository {
  constructor(model, models) {
    super(model);
    this.models = models;
  }

  // ==================== INCLUDES REUTILIZABLES ====================

  /**
   * Include con user y person
   */
  getWithUserInclude() {
    return [
      {
        model: this.models.User,
        as: 'user',
        attributes: ['id', 'username', 'cognito_username', 'is_active'],
        include: [
          {
            model: this.models.Person,
            as: 'person',
            attributes: ['id', 'first_name', 'last_name', 'national_id']
          }
        ]
      }
    ];
  }

  /**
   * Include completo con user, person, role
   */
  getFullInclude() {
    return [
      {
        model: this.models.User,
        as: 'user',
        include: [
          {
            model: this.models.Person,
            as: 'person',
            attributes: ['id', 'first_name', 'last_name', 'national_id'],
            include: [
              {
                model: this.models.Gender,
                as: 'gender',
                attributes: ['id', 'name']
              }
            ]
          },
          {
            model: this.models.Role,
            as: 'role',
            attributes: ['id', 'name', 'description']
          }
        ]
      }
    ];
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Busca un token válido (no usado y no expirado)
   * @param {string} token - Token de reset
   * @param {Object} options - Opciones adicionales de Sequelize
   * @returns {Promise<ResetCredentials|null>}
   */
  async findValidToken(token, options = {}) {
    const now = new Date();

    return await this.findOne(
      {
        token,
        used_at: null,
        expires_at: {
          [Op.gt]: now
        }
      },
      options
    );
  }

  /**
   * Busca un token válido con user incluido
   * @param {string} token - Token de reset
   * @returns {Promise<ResetCredentials|null>}
   */
  async findValidTokenWithUser(token) {
    return await this.findValidToken(token, {
      include: this.getWithUserInclude()
    });
  }

  /**
   * Busca un token válido con include completo
   * @param {string} token - Token de reset
   * @returns {Promise<ResetCredentials|null>}
   */
  async findValidTokenComplete(token) {
    return await this.findValidToken(token, {
      include: this.getFullInclude()
    });
  }

  /**
   * Marca un token como usado
   * @param {string} resetCredentialsId - UUID del registro
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<ResetCredentials>}
   */
  async markAsUsed(resetCredentialsId, options = {}) {
    return await this.update(resetCredentialsId, {
      used_at: new Date()
    }, options);
  }

  /**
   * Invalida todos los tokens pendientes de un usuario
   * @param {string} userId - UUID del usuario
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<number>} Número de tokens invalidados
   */
  async invalidateUserTokens(userId, options = {}) {
    return await this.bulkUpdate(
      { used_at: new Date() },
      {
        user_id: userId,
        used_at: null
      },
      options
    );
  }

  /**
   * Invalida todos los tokens de un tipo específico del usuario
   * @param {string} userId - UUID del usuario
   * @param {string} type - Tipo de reset ('password' | 'mfa')
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<number>} Número de tokens invalidados
   */
  async invalidateUserTokensByType(userId, type, options = {}) {
    return await this.bulkUpdate(
      { used_at: new Date() },
      {
        user_id: userId,
        type,
        used_at: null
      },
      options
    );
  }

  /**
   * Verifica si existe un token válido para un usuario
   * @param {string} userId - UUID del usuario
   * @param {string} type - Tipo de reset ('password' | 'mfa')
   * @returns {Promise<boolean>}
   */
  async hasValidToken(userId, type) {
    const now = new Date();

    const count = await this.count({
      user_id: userId,
      type,
      used_at: null,
      expires_at: {
        [Op.gt]: now
      }
    });

    return count > 0;
  }

  /**
   * Obtiene el historial de resets de un usuario
   * @param {string} userId - UUID del usuario
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: ResetCredentials[], count: number}>}
   */
  async getUserResetHistory(userId, paginationParams = {}) {
    const defaultParams = {
      limit: paginationParams.limit || 50,
      offset: paginationParams.offset || 0,
      sortBy: 'created_at',
      order: 'DESC'
    };

    return await this.findAllPaginated(
      { user_id: userId },
      defaultParams
    );
  }

  /**
   * Cuenta resets exitosos de un usuario por tipo
   * @param {string} userId - UUID del usuario
   * @param {string} type - Tipo de reset ('password' | 'mfa')
   * @returns {Promise<number>}
   */
  async countSuccessfulResets(userId, type) {
    return await this.count({
      user_id: userId,
      type,
      used_at: {
        [Op.ne]: null
      }
    });
  }

  /**
   * Cuenta intentos de reset pendientes de un usuario
   * @param {string} userId - UUID del usuario
   * @param {number} timeWindowHours - Ventana de tiempo en horas
   * @returns {Promise<number>}
   */
  async countRecentResetAttempts(userId, timeWindowHours = 24) {
    const timeThreshold = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

    return await this.count({
      user_id: userId,
      created_at: {
        [Op.gte]: timeThreshold
      }
    });
  }

  /**
   * Limpia tokens expirados (older than X days)
   * @param {number} daysToKeep - Días de retención
   * @returns {Promise<number>} Número de registros eliminados
   */
  async cleanExpiredTokens(daysToKeep = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await this.bulkDelete({
      expires_at: {
        [Op.lt]: cutoffDate
      }
    });
  }

  /**
   * Limpia tokens usados antiguos
   * @param {number} daysToKeep - Días de retención
   * @returns {Promise<number>} Número de registros eliminados
   */
  async cleanUsedTokens(daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await this.bulkDelete({
      used_at: {
        [Op.ne]: null,
        [Op.lt]: cutoffDate
      }
    });
  }

  /**
   * Obtiene estadísticas de resets por tipo
   * @param {number} days - Número de días hacia atrás
   * @returns {Promise<Object>}
   */
  async getResetStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalRequests, passwordResets, mfaResets, successfulResets] = await Promise.all([
      this.count({
        created_at: { [Op.gte]: startDate }
      }),
      this.count({
        type: 'password',
        created_at: { [Op.gte]: startDate }
      }),
      this.count({
        type: 'mfa',
        created_at: { [Op.gte]: startDate }
      }),
      this.count({
        used_at: { [Op.ne]: null },
        created_at: { [Op.gte]: startDate }
      })
    ]);

    return {
      totalRequests,
      passwordResets,
      mfaResets,
      successfulResets,
      successRate: totalRequests > 0 
        ? ((successfulResets / totalRequests) * 100).toFixed(2) 
        : 0
    };
  }

  /**
   * Obtiene el último reset exitoso de un usuario por tipo
   * @param {string} userId - UUID del usuario
   * @param {string} type - Tipo de reset ('password' | 'mfa')
   * @returns {Promise<ResetCredentials|null>}
   */
  async getLastSuccessfulReset(userId, type) {
    return await this.findOne(
      {
        user_id: userId,
        type,
        used_at: {
          [Op.ne]: null
        }
      },
      {
        order: [['used_at', 'DESC']]
      }
    );
  }

  /**
   * Detecta abuso de solicitudes de reset
   * @param {string} email - Email del usuario
   * @param {number} timeWindowHours - Ventana de tiempo en horas
   * @param {number} maxAttempts - Máximo de intentos permitidos
   * @returns {Promise<{abusive: boolean, attempts: number}>}
   */
  async detectResetAbuse(email, timeWindowHours = 1, maxAttempts = 5) {
    const timeThreshold = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);

    const attempts = await this.count({
      email,
      created_at: {
        [Op.gte]: timeThreshold
      }
    });

    return {
      abusive: attempts >= maxAttempts,
      attempts,
      maxAttempts,
      timeWindowHours
    };
  }
}

module.exports = ResetCredentialsRepository;