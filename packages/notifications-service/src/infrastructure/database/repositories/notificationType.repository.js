'use strict';

const { BaseRepository } = require('@abundbank/shared');
const { NotificationType } = require('../index');

class NotificationTypeRepository extends BaseRepository {
  constructor() {
    super(NotificationType);
  }

  /**
   * Busca un tipo de notificación por su código
   * @param {string} code
   * @returns {Promise<Object|null>}
   */
  async findByCode(code) {
    return await this.findOne({ code, is_active: true });
  }

  /**
   * Obtiene todos los tipos activos
   * @returns {Promise<Array>}
   */
  async findAllActive() {
    return await this.findAll(
      { is_active: true },
      { order: [['name', 'ASC']] }
    );
  }

  /**
   * Obtiene tipos que soportan push
   * @returns {Promise<Array>}
   */
  async findSupportingPush() {
    return await this.findAll({
      is_active: true,
      supports_push: true
    });
  }

  /**
   * Obtiene tipos que soportan email
   * @returns {Promise<Array>}
   */
  async findSupportingEmail() {
    return await this.findAll({
      is_active: true,
      supports_email: true
    });
  }

  /**
   * Obtiene tipos por prioridad
   * @param {string} priority - 'low', 'normal', 'high', 'urgent'
   * @returns {Promise<Array>}
   */
  async findByPriority(priority) {
    return await this.findAll(
      { is_active: true, priority },
      { order: [['name', 'ASC']] }
    );
  }

  /**
   * Verifica si un código existe
   * @param {string} code
   * @returns {Promise<boolean>}
   */
  async codeExists(code) {
    return await this.exists({ code });
  }

  /**
   * Busca tipos de notificación con paginación y búsqueda
   * @param {Object} filters - { isActive, supportsPush, supportsEmail, priority }
   * @param {Object} paginationParams - { page, limit, offset, sortBy, order }
   * @param {string} searchTerm - Término de búsqueda (opcional)
   * @returns {Promise<{ rows: Array, count: number }>}
   */
  async findAllPaginated(filters = {}, paginationParams = {}, searchTerm = null) {
    const criteria = {};

    if (filters.isActive !== undefined) {
      criteria.is_active = filters.isActive;
    }

    if (filters.supportsPush !== undefined) {
      criteria.supports_push = filters.supportsPush;
    }

    if (filters.supportsEmail !== undefined) {
      criteria.supports_email = filters.supportsEmail;
    }

    if (filters.priority) {
      criteria.priority = filters.priority;
    }

    const searchConfig = {
      searchTerm,
      searchFields: ['name', 'code', 'description'],
    };

    const options = {
      attributes: [
        'id',
        'code',
        'name',
        'description',
        'supports_push',
        'supports_email',
        'priority',
        'is_active',
        'created_at',
        'updated_at',
      ],
    };

    return await super.findAllPaginated(criteria, paginationParams, searchConfig, options);
  }
}

module.exports = new NotificationTypeRepository();
