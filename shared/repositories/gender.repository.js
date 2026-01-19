'use strict';

const BaseRepository = require('./base.repository');
const { Gender } = require('../models');

class GenderRepository extends BaseRepository {
  constructor() {
    super(Gender);
  }

  /**
   * Busca géneros con paginación y búsqueda
   * @param {Object} filters - { isActive }
   * @param {Object} paginationParams - { page, limit, offset, sortBy, order }
   * @param {string} searchTerm - Término de búsqueda (opcional)
   * @returns {Promise<{ rows: Array, count: number }>}
   */
  async findAllPaginated(filters = {}, paginationParams = {}, searchTerm = null) {
    const criteria = {};

    // Aplicar filtro isActive si viene
    if (filters.isActive !== undefined) {
      criteria.is_active = filters.isActive;
    }

    // Configuración de búsqueda
    const searchConfig = {
      searchTerm,
      searchFields: ['name'], // Buscar solo en campo 'name'
    };

    return await super.findAllPaginated(criteria, paginationParams, searchConfig);
  }
}

module.exports = new GenderRepository();