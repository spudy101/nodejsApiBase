'use strict';

const BaseRepository = require('../../../shared/repositories/base.repository');
const { AvatarTheme } = require('../../../shared/models');

class AvatarThemeRepository extends BaseRepository {
  constructor() {
    super(AvatarTheme);
  }

  /**
   * Busca temas de avatares con paginación y búsqueda
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
      searchFields: ['name'],
    };

    return await super.findAllPaginated(criteria, paginationParams, searchConfig);
  }
}

module.exports = new AvatarThemeRepository();