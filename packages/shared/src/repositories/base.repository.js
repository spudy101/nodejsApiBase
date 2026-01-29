'use strict';

const { Op } = require('sequelize');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async findById(id, options = {}) {
    return await this.model.findByPk(id, options);
  }

  async findOne(criteria, options = {}) {
    return await this.model.findOne({ where: criteria, ...options });
  }

  async findAll(criteria = {}, options = {}) {
    return await this.model.findAll({ where: criteria, ...options });
  }

  async findAndCountAll(criteria = {}, options = {}) {
    return await this.model.findAndCountAll({ where: criteria, ...options });
  }

  /**
   * Busca registros con paginación, ordenamiento, búsqueda y filtros
   * @param {Object} criteria - Condiciones WHERE base
   * @param {Object} paginationParams - { page, limit, offset, sortBy, order }
   * @param {Object} searchConfig - { searchTerm, searchFields } (opcional)
   * @param {Object} options - Opciones adicionales de Sequelize (include, attributes, etc.)
   * @returns {Promise<{ rows: Array, count: number }>}
   */
  async findAllPaginated(criteria = {}, paginationParams = {}, searchConfig = {}, options = {}) {
    const { limit, offset, sortBy, order } = paginationParams;
    const { searchTerm, searchFields = [] } = searchConfig;

    // Construir condición de búsqueda si existe
    let whereCondition = { ...criteria };

    if (searchTerm && searchFields.length > 0) {
      const searchConditions = searchFields.map((field) => ({
        [field]: {
          [Op.iLike]: `%${searchTerm}%`,
        },
      }));

      whereCondition = {
        [Op.and]: [
          criteria,
          {
            [Op.or]: searchConditions,
          },
        ],
      };
    }

    // Ejecutar consulta paginada
    const result = await this.model.findAndCountAll({
      where: whereCondition,
      limit,
      offset,
      order: [[sortBy, order]],
      ...options,
    });

    return result;
  }

  async create(data, options = {}) {
    return await this.model.create(data, options);
  }

  async update(id, data, options = {}) {
    const instance = await this.findById(id, options);
    if (!instance) return null;
    
    return await instance.update(data, options);
  }

  async delete(id, options = {}) {
    return await this.model.destroy({ where: { id }, ...options });
  }

  async count(criteria = {}, options = {}) {
    return await this.model.count({ where: criteria, ...options });
  }

  async exists(criteria) {
    const count = await this.count(criteria);
    return count > 0;
  }

  async bulkCreate(data, options = {}) {
    return await this.model.bulkCreate(data, options);
  }

  /**
   * Helper para actualizar usando el modelo directamente (útil para updates masivos)
   */
  async bulkUpdate(data, criteria, options = {}) {
    return await this.model.update(data, { where: criteria, ...options });
  }

  /**
   * Helper para eliminar usando criterios (útil para deletes masivos)
   */
  async bulkDelete(criteria, options = {}) {
    return await this.model.destroy({ where: criteria, ...options });
  }
}

module.exports = BaseRepository;