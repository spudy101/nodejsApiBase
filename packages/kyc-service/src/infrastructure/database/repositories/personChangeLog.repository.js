'use strict';

const { BaseRepository } = require('@abundbank/shared');
const { Op } = require('sequelize');

class PersonChangeLogRepository extends BaseRepository {
  constructor(model, models) {
    super(model);
    this.models = models;
  }

  // ==================== INCLUDES REUTILIZABLES ====================

  /**
   * Include con persona afectada
   */
  getWithPersonInclude() {
    return [
      {
        model: this.models.Person,
        as: 'person',
        attributes: ['id', 'first_name', 'last_name', 'national_id']
      }
    ];
  }

  /**
   * Include con persona que hizo el cambio
   */
  getWithChangedByInclude() {
    return [
      {
        model: this.models.Person,
        as: 'changed_by_person',
        attributes: ['id', 'first_name', 'last_name', 'national_id']
      }
    ];
  }

  /**
   * Include completo: ambas personas
   */
  getFullInclude() {
    return [
      {
        model: this.models.Person,
        as: 'person',
        attributes: ['id', 'first_name', 'last_name', 'national_id']
      },
      {
        model: this.models.Person,
        as: 'changed_by_person',
        attributes: ['id', 'first_name', 'last_name', 'national_id']
      }
    ];
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Crea un log de cambio
   * @param {Object} logData - Datos del cambio
   * @param {Object} options - Opciones de Sequelize (transaction, etc.)
   * @returns {Promise<PersonChangeLog>}
   */
  async createLog(logData, options = {}) {
    return await this.create({
      person_id: logData.personId || logData.person_id,
      changed_by_person_id: logData.changedByPersonId || logData.changed_by_person_id,
      changed_by_role: logData.changedByRole || logData.changed_by_role,
      change_type: logData.changeType || logData.change_type,
      previous_value: logData.previousValue || logData.previous_value,
      new_value: logData.newValue || logData.new_value,
      change_reason: logData.changeReason || logData.change_reason,
      ip_address: logData.ipAddress || logData.ip_address,
      user_agent: logData.userAgent || logData.user_agent
    }, options);
  }

  /**
   * Obtiene historial de cambios de una persona
   * @param {string} personId - UUID de la persona
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonChangeLog[], count: number}>}
   */
  async getPersonHistory(personId, paginationParams = {}) {
    const defaultParams = {
      limit: paginationParams.limit || 50,
      offset: paginationParams.offset || 0,
      sortBy: 'created_at',
      order: 'DESC'
    };

    return await this.findAllPaginated(
      { person_id: personId },
      defaultParams,
      {},
      { include: this.getWithChangedByInclude() }
    );
  }

  /**
   * Obtiene cambios realizados por una persona (como admin/usuario)
   * @param {string} changedByPersonId - UUID de la persona que hizo cambios
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonChangeLog[], count: number}>}
   */
  async getChangesByPerson(changedByPersonId, paginationParams = {}) {
    const defaultParams = {
      limit: paginationParams.limit || 50,
      offset: paginationParams.offset || 0,
      sortBy: 'created_at',
      order: 'DESC'
    };

    return await this.findAllPaginated(
      { changed_by_person_id: changedByPersonId },
      defaultParams,
      {},
      { include: this.getWithPersonInclude() }
    );
  }

  /**
   * Obtiene cambios por tipo
   * @param {string} changeType - Tipo de cambio (email, password, etc.)
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonChangeLog[], count: number}>}
   */
  async getByChangeType(changeType, paginationParams = {}) {
    return await this.findAllPaginated(
      { change_type: changeType },
      paginationParams,
      {},
      { include: this.getFullInclude() }
    );
  }

  /**
   * Obtiene cambios por rol del que los realizó
   * @param {string} role - Rol (admin, user, system)
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonChangeLog[], count: number}>}
   */
  async getByRole(role, paginationParams = {}) {
    return await this.findAllPaginated(
      { changed_by_role: role },
      paginationParams,
      {},
      { include: this.getFullInclude() }
    );
  }

  /**
   * Obtiene cambios en un rango de fechas
   * @param {Date} startDate - Fecha inicio
   * @param {Date} endDate - Fecha fin
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonChangeLog[], count: number}>}
   */
  async getByDateRange(startDate, endDate, paginationParams = {}) {
    return await this.findAllPaginated(
      {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      },
      paginationParams,
      {},
      { include: this.getFullInclude() }
    );
  }

  /**
   * Cuenta cambios de una persona
   * @param {string} personId - UUID de la persona
   * @returns {Promise<number>}
   */
  async countByPerson(personId) {
    return await this.count({ person_id: personId });
  }

  /**
   * Cuenta cambios por tipo
   * @param {string} changeType - Tipo de cambio
   * @returns {Promise<number>}
   */
  async countByType(changeType) {
    return await this.count({ change_type: changeType });
  }

  /**
   * Obtiene estadísticas de cambios
   * @param {number} days - Días hacia atrás (default: 30)
   * @returns {Promise<Object>}
   */
  async getChangeStats(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalChanges, emailChanges, passwordChanges, statusChanges] = await Promise.all([
      this.count({
        created_at: { [Op.gte]: startDate }
      }),
      this.count({
        change_type: 'email',
        created_at: { [Op.gte]: startDate }
      }),
      this.count({
        change_type: 'password',
        created_at: { [Op.gte]: startDate }
      }),
      this.count({
        change_type: 'account_status',
        created_at: { [Op.gte]: startDate }
      })
    ]);

    return {
      totalChanges,
      emailChanges,
      passwordChanges,
      statusChanges,
      period: `${days} days`
    };
  }

  /**
   * Obtiene último cambio de un tipo para una persona
   * @param {string} personId - UUID de la persona
   * @param {string} changeType - Tipo de cambio
   * @returns {Promise<PersonChangeLog|null>}
   */
  async getLastChangeByType(personId, changeType) {
    return await this.findOne(
      {
        person_id: personId,
        change_type: changeType
      },
      {
        order: [['created_at', 'DESC']],
        include: this.getWithChangedByInclude()
      }
    );
  }

  /**
   * Busca cambios por IP
   * @param {string} ipAddress - Dirección IP
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonChangeLog[], count: number}>}
   */
  async findByIP(ipAddress, paginationParams = {}) {
    return await this.findAllPaginated(
      { ip_address: ipAddress },
      paginationParams,
      {},
      { include: this.getFullInclude() }
    );
  }

  /**
   * Obtiene cambios sospechosos (múltiples IPs en poco tiempo)
   * @param {string} personId - UUID de la persona
   * @param {number} hours - Ventana de tiempo en horas
   * @returns {Promise<Object>}
   */
  async detectSuspiciousChanges(personId, hours = 24) {
    const timeThreshold = new Date(Date.now() - hours * 60 * 60 * 1000);

    const changes = await this.findAll(
      {
        person_id: personId,
        created_at: { [Op.gte]: timeThreshold }
      },
      {
        attributes: ['ip_address', 'change_type', 'created_at'],
        order: [['created_at', 'DESC']]
      }
    );

    const uniqueIPs = new Set(changes.map(c => c.ip_address));

    return {
      suspicious: uniqueIPs.size > 3,
      uniqueIPs: uniqueIPs.size,
      totalChanges: changes.length,
      recentChanges: changes.slice(0, 5)
    };
  }

  /**
   * Limpia logs antiguos (older than X days)
   * @param {number} daysToKeep - Días de retención
   * @returns {Promise<number>} Número de registros eliminados
   */
  async cleanOldLogs(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    return await this.bulkDelete({
      created_at: {
        [Op.lt]: cutoffDate
      }
    });
  }
}

module.exports = PersonChangeLogRepository;