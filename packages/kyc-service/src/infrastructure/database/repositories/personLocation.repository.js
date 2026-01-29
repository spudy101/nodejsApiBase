'use strict';

const { BaseRepository } = require('@abundbank/shared');

class PersonLocationRepository extends BaseRepository {
  constructor(model, models) {
    super(model);
    this.models = models;
  }

  // ==================== INCLUDES REUTILIZABLES ====================

  /**
   * Include básico: Solo ciudad, departamento, país
   */
  getBasicInclude() {
    return [
      {
        model: this.models.Country,
        as: 'country',
        attributes: ['id', 'name', 'code']
      },
      {
        model: this.models.Department,
        as: 'department',
        attributes: ['id', 'name'],
        include: [
          {
            model: this.models.Country,
            as: 'country',
            attributes: ['id', 'name', 'code']
          }
        ]
      },
      {
        model: this.models.City,
        as: 'city',
        attributes: ['id', 'name'],
        include: [
          {
            model: this.models.Department,
            as: 'department',
            attributes: ['id', 'name']
          }
        ]
      }
    ];
  }

  /**
   * Include con persona
   */
  getWithPersonInclude() {
    return [
      {
        model: this.models.Person,
        as: 'person',
        attributes: ['id', 'first_name', 'last_name', 'national_id']
      },
      ...this.getBasicInclude()
    ];
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Busca ubicación por person_id
   * @param {string} personId - UUID de la persona
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<PersonLocation|null>}
   */
  async findByPersonId(personId, options = {}) {
    return await this.findOne(
      { person_id: personId },
      {
        include: this.getBasicInclude(),
        ...options
      }
    );
  }

  /**
   * Busca ubicación por person_id con persona incluida
   * @param {string} personId - UUID de la persona
   * @returns {Promise<PersonLocation|null>}
   */
  async findByPersonIdWithPerson(personId) {
    return await this.findOne(
      { person_id: personId },
      {
        include: this.getWithPersonInclude()
      }
    );
  }

  /**
   * Crea o actualiza la ubicación de una persona (upsert)
   * @param {string} personId - UUID de la persona
   * @param {Object} locationData - Datos de la ubicación
   * @param {Object} options - Opciones de Sequelize (transaction, etc.)
   * @returns {Promise<PersonLocation>}
   */
  async upsertByPersonId(personId, locationData, options = {}) {
    const existingLocation = await this.findByPersonId(personId, options);

    const data = {
      person_id: personId,
      country_id: locationData.country_id || locationData.countryId,
      department_id: locationData.department_id || locationData.departmentId,
      city_id: locationData.city_id || locationData.cityId,
      address: locationData.address,
      postal_code: locationData.postal_code || locationData.postalCode || null,
      type: locationData.type || null
    };

    if (existingLocation) {
      // Actualizar existente
      return await existingLocation.update(data, options);
    } else {
      // Crear nuevo
      return await this.create(data, options);
    }
  }

  /**
   * Actualiza la dirección de una ubicación
   * @param {string} locationId - UUID de la ubicación
   * @param {string} newAddress - Nueva dirección
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<PersonLocation>}
   */
  async updateAddress(locationId, newAddress, options = {}) {
    return await this.update(locationId, {
      address: newAddress
    }, options);
  }

  /**
   * Actualiza el código postal
   * @param {string} locationId - UUID de la ubicación
   * @param {string} postalCode - Código postal
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<PersonLocation>}
   */
  async updatePostalCode(locationId, postalCode, options = {}) {
    return await this.update(locationId, {
      postal_code: postalCode
    }, options);
  }

  /**
   * Actualiza la ciudad (y opcionalmente departamento/país)
   * @param {string} locationId - UUID de la ubicación
   * @param {Object} locationData - { city_id, department_id?, country_id? }
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<PersonLocation>}
   */
  async updateCity(locationId, locationData, options = {}) {
    const updateData = {
      city_id: locationData.city_id || locationData.cityId
    };

    if (locationData.department_id || locationData.departmentId) {
      updateData.department_id = locationData.department_id || locationData.departmentId;
    }

    if (locationData.country_id || locationData.countryId) {
      updateData.country_id = locationData.country_id || locationData.countryId;
    }

    return await this.update(locationId, updateData, options);
  }

  /**
   * Busca ubicaciones por ciudad
   * @param {string} cityId - UUID de la ciudad
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonLocation[], count: number}>}
   */
  async findByCity(cityId, paginationParams = {}) {
    return await this.findAllPaginated(
      { city_id: cityId },
      paginationParams,
      {},
      { include: this.getBasicInclude() }
    );
  }

  /**
   * Busca ubicaciones por departamento
   * @param {string} departmentId - UUID del departamento
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonLocation[], count: number}>}
   */
  async findByDepartment(departmentId, paginationParams = {}) {
    return await this.findAllPaginated(
      { department_id: departmentId },
      paginationParams,
      {},
      { include: this.getBasicInclude() }
    );
  }

  /**
   * Busca ubicaciones por país
   * @param {string} countryId - UUID del país
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonLocation[], count: number}>}
   */
  async findByCountry(countryId, paginationParams = {}) {
    return await this.findAllPaginated(
      { country_id: countryId },
      paginationParams,
      {},
      { include: this.getBasicInclude() }
    );
  }

  /**
   * Cuenta ubicaciones por ciudad
   * @param {string} cityId - UUID de la ciudad
   * @returns {Promise<number>}
   */
  async countByCity(cityId) {
    return await this.count({ city_id: cityId });
  }

  /**
   * Cuenta ubicaciones por departamento
   * @param {string} departmentId - UUID del departamento
   * @returns {Promise<number>}
   */
  async countByDepartment(departmentId) {
    return await this.count({ department_id: departmentId });
  }

  /**
   * Cuenta ubicaciones por país
   * @param {string} countryId - UUID del país
   * @returns {Promise<number>}
   */
  async countByCountry(countryId) {
    return await this.count({ country_id: countryId });
  }

  /**
   * Verifica si una persona tiene ubicación registrada
   * @param {string} personId - UUID de la persona
   * @returns {Promise<boolean>}
   */
  async existsByPersonId(personId) {
    return await this.exists({ person_id: personId });
  }

  /**
   * Busca ubicaciones por código postal
   * @param {string} postalCode - Código postal
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonLocation[], count: number}>}
   */
  async findByPostalCode(postalCode, paginationParams = {}) {
    return await this.findAllPaginated(
      { postal_code: postalCode },
      paginationParams,
      {},
      { include: this.getBasicInclude() }
    );
  }

  /**
   * Busca ubicaciones por tipo
   * @param {string} type - Tipo de ubicación (ej: 'home', 'work')
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonLocation[], count: number}>}
   */
  async findByType(type, paginationParams = {}) {
    return await this.findAllPaginated(
      { type },
      paginationParams,
      {},
      { include: this.getBasicInclude() }
    );
  }

  /**
   * Elimina la ubicación de una persona
   * @param {string} personId - UUID de la persona
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<number>} Número de registros eliminados
   */
  async deleteByPersonId(personId, options = {}) {
    return await this.bulkDelete({ person_id: personId }, options);
  }
}

module.exports = PersonLocationRepository;