'use strict';

const BaseRepository = require('./base.repository');
const { City } = require('../models');

class CityRepository extends BaseRepository {
  constructor() {
    super(City);
  }

  /**
   * Busca ciudades con paginación y búsqueda
   * @param {Object} filters - { isActive, departmentId }
   * @param {Object} paginationParams - { page, limit, offset, sortBy, order }
   * @param {string} searchTerm - Término de búsqueda (opcional)
   * @returns {Promise<{ rows: Array, count: number }>}
   */
  async findAllPaginated(filters = {}, paginationParams = {}, searchTerm = null) {
    const criteria = {};

    if (filters.isActive !== undefined) {
      criteria.is_active = filters.isActive;
    }

    if (filters.departmentId) {
      criteria.department_id = filters.departmentId;
    }

    const searchConfig = {
      searchTerm,
      searchFields: ['name'],
    };

    // Incluir relación con Department y Country
    const options = {
      include: [
        {
          association: 'department',
          attributes: ['department_id', 'name'],
          include: [
            {
              association: 'country',
              attributes: ['country_id', 'name', 'code'],
            },
          ],
        },
      ],
    };

    return await super.findAllPaginated(criteria, paginationParams, searchConfig, options);
  }
}

module.exports = new CityRepository();