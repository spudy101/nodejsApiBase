'use strict';

const { BaseRepository } = require('@abundbank/shared');

class PersonRepository extends BaseRepository {
  constructor(model, models) {
    super(model);
    this.models = models;
  }

  // ==================== INCLUDES REUTILIZABLES ====================

  /**
   * Include básico: Solo datos esenciales de la persona
   */
  getBasicInclude() {
    return [
      {
        model: this.models.Gender,
        as: 'gender',
        attributes: ['id', 'name']
      },
      {
        model: this.models.Country,
        as: 'country',
        attributes: ['id', 'name', 'code', 'icon_url']
      }
    ];
  }

  /**
   * Include con contacto
   */
  getWithContactInclude() {
    return [
      ...this.getBasicInclude(),
      {
        model: this.models.PersonContact,
        as: 'contact',
        include: [
          {
            model: this.models.PhonePrefix,
            as: 'phone_primary_prefix',
            attributes: ['id', 'prefix'],
            include: [
              {
                model: this.models.Country,
                as: 'country',
                attributes: ['id', 'name', 'code']
              }
            ]
          },
          {
            model: this.models.PhonePrefix,
            as: 'phone_secondary_prefix',
            attributes: ['id', 'prefix'],
            include: [
              {
                model: this.models.Country,
                as: 'country',
                attributes: ['id', 'name', 'code']
              }
            ]
          }
        ]
      }
    ];
  }

  /**
   * Include con ubicación
   */
  getWithLocationInclude() {
    return [
      ...this.getBasicInclude(),
      {
        model: this.models.PersonLocation,
        as: 'location',
        include: [
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
        ]
      }
    ];
  }

  /**
   * Include completo: Persona + Contacto + Ubicación + Usuario
   */
  getFullInclude() {
    return [
      ...this.getBasicInclude(),
      {
        model: this.models.PersonContact,
        as: 'contact',
        include: [
          {
            model: this.models.PhonePrefix,
            as: 'phone_primary_prefix',
            attributes: ['id', 'prefix'],
            include: [
              {
                model: this.models.Country,
                as: 'country',
                attributes: ['id', 'name', 'code']
              }
            ]
          },
          {
            model: this.models.PhonePrefix,
            as: 'phone_secondary_prefix',
            attributes: ['id', 'prefix'],
            include: [
              {
                model: this.models.Country,
                as: 'country',
                attributes: ['id', 'name', 'code']
              }
            ]
          }
        ]
      },
      {
        model: this.models.PersonLocation,
        as: 'location',
        include: [
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
        ]
      },
      {
        model: this.models.User,
        as: 'user',
        include: [
          {
            model: this.models.Role,
            as: 'role',
            attributes: ['id', 'name', 'description']
          },
          {
            model: this.models.Avatar,
            as: 'avatar',
            attributes: ['id', 'name', 'image_url'],
            include: [
              {
                model: this.models.AvatarTheme,
                as: 'avatar_theme',
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      }
    ];
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Busca persona por national_id
   * @param {string} nationalId - Cédula/RUT/DNI
   * @param {Object} options - Opciones adicionales de Sequelize
   * @returns {Promise<Person|null>}
   */
  async findByNationalId(nationalId, options = {}) {
    return await this.findOne(
      { national_id: nationalId },
      options
    );
  }

  /**
   * Busca persona por national_id con include completo
   * @param {string} nationalId - Cédula/RUT/DNI
   * @returns {Promise<Person|null>}
   */
  async findByNationalIdComplete(nationalId) {
    return await this.findByNationalId(nationalId, {
      include: this.getFullInclude()
    });
  }

  /**
   * Busca persona por ID con include completo
   * @param {string} personId - UUID de la persona
   * @returns {Promise<Person|null>}
   */
  async findByIdComplete(personId) {
    return await this.findById(personId, {
      include: this.getFullInclude()
    });
  }

  /**
   * Busca persona por ID con contacto incluido
   * @param {string} personId - UUID de la persona
   * @returns {Promise<Person|null>}
   */
  async findByIdWithContact(personId) {
    return await this.findById(personId, {
      include: this.getWithContactInclude()
    });
  }

  /**
   * Busca persona por ID con ubicación incluida
   * @param {string} personId - UUID de la persona
   * @returns {Promise<Person|null>}
   */
  async findByIdWithLocation(personId) {
    return await this.findById(personId, {
      include: this.getWithLocationInclude()
    });
  }

  /**
   * Verifica si existe una persona con el national_id dado
   * @param {string} nationalId - Cédula/RUT/DNI
   * @returns {Promise<boolean>}
   */
  async existsByNationalId(nationalId) {
    return await this.exists({ national_id: nationalId });
  }

  /**
   * Busca personas con paginación e include básico
   * @param {Object} criteria - Criterios de búsqueda
   * @param {Object} paginationParams - { limit, offset, sortBy, order }
   * @param {Object} searchConfig - { searchTerm, searchFields }
   * @returns {Promise<{rows: Person[], count: number}>}
   */
  async findAllPaginatedWithBasicInfo(criteria = {}, paginationParams = {}, searchConfig = {}) {
    return await this.findAllPaginated(
      criteria,
      paginationParams,
      searchConfig,
      { include: this.getBasicInclude() }
    );
  }

  /**
   * Actualiza los datos básicos de una persona
   * @param {string} personId - UUID de la persona
   * @param {Object} data - Datos a actualizar
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<Person>}
   */
  async updateBasicInfo(personId, data, options = {}) {
    const allowedFields = ['first_name', 'last_name', 'birth_date', 'gender_id', 'country_id'];
    const updateData = {};

    allowedFields.forEach(field => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    return await this.update(personId, updateData, options);
  }

  /**
   * Busca personas por país
   * @param {string} countryId - UUID del país
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: Person[], count: number}>}
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
   * Cuenta personas por género
   * @param {string} genderId - UUID del género
   * @returns {Promise<number>}
   */
  async countByGender(genderId) {
    return await this.count({ gender_id: genderId });
  }
}

module.exports = PersonRepository;