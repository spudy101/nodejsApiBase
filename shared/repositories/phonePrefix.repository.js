'use strict';

const BaseRepository = require('./base.repository');
const { PhonePrefix } = require('../models');

class PhonePrefixRepository extends BaseRepository {
  constructor() {
    super(PhonePrefix);
  }

  /**
   * Busca prefijos telefónicos con paginación y búsqueda
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
      searchFields: ['prefix'],
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

module.exports = new PhonePrefixRepository();