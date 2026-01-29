'use strict';

const { BaseRepository } = require('@abundbank/shared');

class GenderRepository extends BaseRepository {
  constructor(model, models) {
    super(model);
    this.models = models;
  }

  // ==================== INCLUDES REUTILIZABLES ====================

  /**
   * Include con personas (para estadísticas)
   */
  getWithPersonsInclude() {
    return [
      {
        model: this.models.Person,
        as: 'persons',
        attributes: ['id', 'first_name', 'last_name']
      }
    ];
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Busca género por nombre
   * @param {string} name - Nombre del género
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Gender|null>}
   */
  async findByName(name, options = {}) {
    return await this.findOne(
      { name },
      options
    );
  }

  /**
   * Busca género activo por nombre
   * @param {string} name - Nombre del género
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Gender|null>}
   */
  async findActiveByName(name, options = {}) {
    return await this.findOne(
      { name, is_active: true },
      options
    );
  }

  /**
   * Verifica si existe un género con el nombre dado
   * @param {string} name - Nombre del género
   * @returns {Promise<boolean>}
   */
  async existsByName(name) {
    return await this.exists({ name });
  }

  /**
   * Obtiene todos los géneros activos
   * @returns {Promise<Gender[]>}
   */
  async findAllActive() {
    return await this.findAll(
      { is_active: true },
      {
        order: [['name', 'ASC']]
      }
    );
  }

  /**
   * Activa o desactiva un género
   * @param {string} genderId - UUID del género
   * @param {boolean} isActive - Estado activo
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<Gender>}
   */
  async setActiveStatus(genderId, isActive, options = {}) {
    return await this.update(genderId, {
      is_active: isActive
    }, options);
  }

  /**
   * Cuenta personas por género
   * @param {string} genderId - UUID del género
   * @returns {Promise<number>}
   */
  async countPersons(genderId) {
    return await this.model.count({
      where: { id: genderId },
      include: [
        {
          model: this.models.Person,
          as: 'persons',
          attributes: []
        }
      ]
    });
  }

  /**
   * Obtiene géneros con conteo de personas
   * @returns {Promise<Array>}
   */
  async getGendersWithPersonCount() {
    const genders = await this.findAll({}, {
      include: this.getWithPersonsInclude(),
      order: [['name', 'ASC']]
    });

    return genders.map(gender => ({
      id: gender.id,
      name: gender.name,
      is_active: gender.is_active,
      person_count: gender.persons ? gender.persons.length : 0
    }));
  }

  /**
   * Busca géneros por nombre (búsqueda parcial)
   * @param {string} searchTerm - Término de búsqueda
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: Gender[], count: number}>}
   */
  async searchByName(searchTerm, paginationParams = {}) {
    return await this.findAllPaginated(
      {},
      paginationParams,
      {
        searchTerm,
        searchFields: ['name']
      }
    );
  }

  /**
   * Cuenta géneros activos
   * @returns {Promise<number>}
   */
  async countActive() {
    return await this.count({ is_active: true });
  }

  /**
   * Obtiene estadísticas de distribución por género
   * @returns {Promise<Array>}
   */
  async getDistributionStats() {
    const genders = await this.model.findAll({
      include: [
        {
          model: this.models.Person,
          as: 'persons',
          attributes: []
        }
      ],
      attributes: [
        'id',
        'name',
        'is_active',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('persons.id')), 'person_count']
      ],
      group: ['Gender.id'],
      order: [[this.model.sequelize.literal('person_count'), 'DESC']],
      raw: true
    });

    return genders;
  }

  /**
   * Verifica si un género está siendo usado
   * @param {string} genderId - UUID del género
   * @returns {Promise<boolean>}
   */
  async isBeingUsed(genderId) {
    const count = await this.countPersons(genderId);
    return count > 0;
  }

  /**
   * Actualiza el nombre de un género
   * @param {string} genderId - UUID del género
   * @param {string} newName - Nuevo nombre
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<Gender>}
   */
  async updateName(genderId, newName, options = {}) {
    // Verificar que no exista otro género con ese nombre
    const existing = await this.findByName(newName);
    if (existing && existing.id !== genderId) {
      throw new Error('Ya existe un género con ese nombre');
    }

    return await this.update(genderId, {
      name: newName
    }, options);
  }
}

module.exports = GenderRepository;