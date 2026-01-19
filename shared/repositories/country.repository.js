'use strict';

const BaseRepository = require('./base.repository');
const { Country } = require('../models');

class CountryRepository extends BaseRepository {
  constructor() {
    super(Country);
  }

  /**
   * Busca países con paginación y búsqueda
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
      searchFields: ['name', 'code'], // Buscar en nombre y código ISO
    };

    return await super.findAllPaginated(criteria, paginationParams, searchConfig);
  }
}

module.exports = new CountryRepository();