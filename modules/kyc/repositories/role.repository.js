'use strict';

const BaseRepository = require('../../../shared/repositories/base.repository');
const { Role } = require('../../../shared/models');

class RoleRepository extends BaseRepository {
  constructor() {
    super(Role);
  }

  /**
   * Busca roles con paginación y búsqueda
   * @param {Object} filters - { isActive }
   * @param {Object} paginationParams - { page, limit, offset, sortBy, order }
   * @param {string} searchTerm - Término de búsqueda (opcional)
   * @returns {Promise<{ rows: Array, count: number }>}
   */
  async findAllPaginated(filters = {}, paginationParams = {}, searchTerm = null) {
    const criteria = {};

    if (filters.isActive !== undefined) {
      criteria.is_active = filters.isActive;
    }

    const searchConfig = {
      searchTerm,
      searchFields: ['name', 'description'],
    };

    return await super.findAllPaginated(criteria, paginationParams, searchConfig);
  }

  /**
   * Busca un rol por su nombre
   * @param {string} name - Nombre del rol
   * @returns {Promise<Role|null>}
   */
  async findByName(name) {
    return await this.findOne({ name });
  }
}

module.exports = new RoleRepository();