'use strict';

const BaseRepository = require('./base.repository');
const { UserChangeLog } = require('../models');

class UserChangeLogRepository extends BaseRepository {
  constructor() {
    super(UserChangeLog);
  }

  /**
   * Crea un log de cambio de usuario
   * @param {Object} logData - Datos del log
   * @param {Object} options - Opciones de Sequelize (transaction, etc.)
   * @returns {Promise<UserChangeLog>}
   */
  async createLog(logData, options = {}) {
    return await this.create({
      user_id: logData.userId,
      changed_by_user_id: logData.changedByUserId || null,
      changed_by_role: logData.changedByRole,
      change_type: logData.changeType,
      previous_value: logData.previousValue || null,
      new_value: logData.newValue || null,
      change_reason: logData.changeReason || null,
      ip_address: logData.ipAddress || null,
      user_agent: logData.userAgent || null,
    }, options);
  }

  /**
   * Obtiene logs de un usuario específico
   * @param {string} userId - ID del usuario
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: Array, count: number}>}
   */
  async findByUserId(userId, paginationParams = {}) {
    const criteria = { user_id: userId };
    
    return await this.findAllPaginated(
      criteria,
      paginationParams,
      {},
      {
        include: [
          {
            association: 'changedBy',
            attributes: ['user_id', 'username'],
            include: [
              {
                association: 'person',
                attributes: ['first_name', 'last_name'],
              },
            ],
          },
        ],
      }
    );
  }

  /**
   * Obtiene logs por tipo de cambio
   * @param {string} changeType - Tipo de cambio
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: Array, count: number}>}
   */
  async findByChangeType(changeType, paginationParams = {}) {
    const criteria = { change_type: changeType };
    
    return await this.findAllPaginated(criteria, paginationParams);
  }

  /**
   * Obtiene logs realizados por un admin específico
   * @param {string} adminUserId - ID del admin
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: Array, count: number}>}
   */
  async findByAdminUser(adminUserId, paginationParams = {}) {
    const criteria = {
      changed_by_user_id: adminUserId,
      changed_by_role: 'admin',
    };
    
    return await this.findAllPaginated(
      criteria,
      paginationParams,
      {},
      {
        include: [
          {
            association: 'user',
            attributes: ['user_id', 'username'],
            include: [
              {
                association: 'person',
                attributes: ['first_name', 'last_name'],
              },
            ],
          },
        ],
      }
    );
  }

  /**
   * Cuenta cambios por tipo para un usuario
   * @param {string} userId - ID del usuario
   * @param {string} changeType - Tipo de cambio
   * @returns {Promise<number>}
   */
  async countByUserAndType(userId, changeType) {
    return await this.count({
      user_id: userId,
      change_type: changeType,
    });
  }

  /**
   * Obtiene el último cambio de un tipo específico para un usuario
   * @param {string} userId - ID del usuario
   * @param {string} changeType - Tipo de cambio
   * @returns {Promise<UserChangeLog|null>}
   */
  async findLastChangeByType(userId, changeType) {
    return await this.model.findOne({
      where: {
        user_id: userId,
        change_type: changeType,
      },
      order: [['created_at', 'DESC']],
    });
  }

  // Override para usar log_id en vez de id
  async delete(logId) {
    return await this.model.destroy({ where: { log_id: logId } });
  }

  // Override findById para usar log_id
  async findById(logId, options = {}) {
    return await this.model.findByPk(logId, options);
  }
}

module.exports = new UserChangeLogRepository();