'use strict';

const BaseRepository = require('./base.repository');
const { Avatar } = require('../models');

class AvatarRepository extends BaseRepository {
  constructor() {
    super(Avatar);
  }

  /**
   * Busca avatares con paginación y búsqueda
   * @param {Object} filters - { isActive, themeId }
   * @param {Object} paginationParams - { page, limit, offset, sortBy, order }
   * @param {string} searchTerm - Término de búsqueda (opcional)
   * @returns {Promise<{ rows: Array, count: number }>}
   */
  async findAllPaginated(filters = {}, paginationParams = {}, searchTerm = null) {
    const criteria = {};

    if (filters.isActive !== undefined) {
      criteria.is_active = filters.isActive;
    }

    if (filters.themeId) {
      criteria.avatar_theme_id = filters.themeId;
    }

    const searchConfig = {
      searchTerm,
      searchFields: ['name'],
    };

    // Incluir relación con AvatarTheme
    const options = {
      include: [
        {
          association: 'theme',
          attributes: ['avatar_theme_id', 'name'],
        },
      ],
    };

    return await super.findAllPaginated(criteria, paginationParams, searchConfig, options);
  }
}

module.exports = new AvatarRepository();