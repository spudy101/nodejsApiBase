'use strict';

const BaseRepository = require('../../../shared/repositories/base.repository');
const { Institution } = require('../../../shared/models');
const { Op } = require('sequelize');

class InstitutionRepository extends BaseRepository {
  constructor() {
    super(Institution);
  }

  /**
   * Encuentra institución por nombre
   * @param {string} name
   * @returns {Promise<Object|null>}
   */
  async findByName(name) {
    return await this.model.findOne({
      where: { name },
    });
  }

  /**
   * Encuentra instituciones con convenio
   * @returns {Promise<Array>}
   */
  async findWithAgreement() {
    return await this.model.findAll({
      where: { has_agreement: true },
      order: [['name', 'ASC']],
    });
  }

  /**
   * Verifica si una institución existe por ID
   * @param {string} institutionId
   * @returns {Promise<boolean>}
   */
  async existsById(institutionId) {
    const count = await this.model.count({
      where: { institution_id: institutionId },
    });
    return count > 0;
  }

  /**
   * Encuentra instituciones paginadas con filtros
   * @param {Object} filters
   * @param {Object} paginationParams
   * @param {string} searchTerm
   * @returns {Promise<Object>}
   */
  async findAllPaginated(filters, paginationParams, searchTerm = null) {
    const where = {};

    if (filters.hasAgreement !== undefined) {
      where.has_agreement = filters.hasAgreement;
    }

    // Search en nombre
    if (searchTerm) {
      where.name = {
        [Op.iLike]: `%${searchTerm}%`,
      };
    }

    return await this.model.findAndCountAll({
      where,
      limit: paginationParams.limit,
      offset: paginationParams.offset,
      order: [[paginationParams.sortBy, paginationParams.order]],
    });
  }
}

module.exports = new InstitutionRepository();