'use strict';

const BaseRepository = require('./base.repository');
const { Department } = require('../models');

class DepartmentRepository extends BaseRepository {
  constructor() {
    super(Department);
  }

  /**
   * Busca departamentos/estados con paginación y búsqueda
   * @param {Object} filters - { isActive, countryId }
   * @param {Object} paginationParams - { page, limit, offset, sortBy, order }
   * @param {string} searchTerm - Término de búsqueda (opcional)
   * @returns {Promise<{ rows: Array, count: number }>}
   */
  async findAllPaginated(filters = {}, paginationParams = {}, searchTerm = null) {
    const criteria = {};

    if (filters.isActive !== undefined) {
      criteria.is_active = filters.isActive;
    }

    if (filters.countryId) {
      criteria.country_id = filters.countryId;
    }

    const searchConfig = {
      searchTerm,
      searchFields: ['name'],
    };

    // Incluir relación con Country
    const options = {
      include: [
        {
          association: 'country',
          attributes: ['country_id', 'name', 'code'],
        },
      ],
    };

    return await super.findAllPaginated(criteria, paginationParams, searchConfig, options);
  }
}

module.exports = new DepartmentRepository();