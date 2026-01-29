'use strict';

const { BaseRepository } = require('@abundbank/shared');

class PersonContactRepository extends BaseRepository {
  constructor(model, models) {
    super(model);
    this.models = models;
  }

  // ==================== INCLUDES REUTILIZABLES ====================

  /**
   * Include básico: Solo prefijos telefónicos
   */
  getBasicInclude() {
    return [
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
        attributes: ['id', 'first_name', 'last_name', 'national_id'],
        include: [
          {
            model: this.models.User,
            as: 'user',
            attributes: ['id', 'username', 'is_active', 'cognito_username']
          }
        ]
      },
      ...this.getBasicInclude()
    ];
  }

  /**
   * Include completo: Persona + User + Role + Prefijos
   */
  getFullInclude() {
    return [
      {
        model: this.models.Person,
        as: 'person',
        include: [
          {
            model: this.models.Gender,
            as: 'gender',
            attributes: ['id', 'name']
          },
          {
            model: this.models.Country,
            as: 'country',
            attributes: ['id', 'name', 'code']
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
        ]
      },
      ...this.getBasicInclude()
    ];
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Busca contacto por email
   * @param {string} email - Email a buscar
   * @param {Object} options - Opciones adicionales de Sequelize
   * @returns {Promise<PersonContact|null>}
   */
  async findByEmail(email, options = {}) {
    return await this.findOne(
      { email },
      options
    );
  }

  /**
   * Busca contacto por email con persona incluida
   * @param {string} email - Email a buscar
   * @returns {Promise<PersonContact|null>}
   */
  async findByEmailWithPerson(email) {
    return await this.findByEmail(email, {
      include: this.getWithPersonInclude()
    });
  }

  /**
   * Busca contacto por email con include completo
   * @param {string} email - Email a buscar
   * @returns {Promise<PersonContact|null>}
   */
  async findByEmailComplete(email) {
    return await this.findByEmail(email, {
      include: this.getFullInclude()
    });
  }

  /**
   * Busca contacto por person_id
   * @param {string} personId - UUID de la persona
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<PersonContact|null>}
   */
  async findByPersonId(personId, options = {}) {
    return await this.findOne(
      { person_id: personId },
      options
    );
  }

  /**
   * Busca contacto por person_id con prefijos incluidos
   * @param {string} personId - UUID de la persona
   * @returns {Promise<PersonContact|null>}
   */
  async findByPersonIdWithPrefixes(personId) {
    return await this.findByPersonId(personId, {
      include: this.getBasicInclude()
    });
  }

  /**
   * Verifica si existe un contacto con el email dado
   * @param {string} email - Email a verificar
   * @returns {Promise<boolean>}
   */
  async existsByEmail(email) {
    return await this.exists({ email });
  }

  /**
   * Verifica el email de un contacto
   * @param {string} contactId - UUID del contacto
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<PersonContact>}
   */
  async verifyEmail(contactId, options = {}) {
    return await this.update(contactId, {
      email_verified_at: new Date()
    }, options);
  }

  /**
   * Verifica el teléfono primario
   * @param {string} contactId - UUID del contacto
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<PersonContact>}
   */
  async verifyPrimaryPhone(contactId, options = {}) {
    return await this.update(contactId, {
      phone_primary_verified_at: new Date()
    }, options);
  }

  /**
   * Verifica el teléfono secundario
   * @param {string} contactId - UUID del contacto
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<PersonContact>}
   */
  async verifySecondaryPhone(contactId, options = {}) {
    return await this.update(contactId, {
      phone_secondary_verified_at: new Date()
    }, options);
  }

  /**
   * Actualiza el email de un contacto
   * @param {string} contactId - UUID del contacto
   * @param {string} newEmail - Nuevo email
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<PersonContact>}
   */
  async updateEmail(contactId, newEmail, options = {}) {
    return await this.update(contactId, {
      email: newEmail,
      email_verified_at: null // Requiere verificación nuevamente
    }, options);
  }

  /**
   * Actualiza el teléfono primario
   * @param {string} contactId - UUID del contacto
   * @param {Object} phoneData - { phone_primary, phone_primary_prefix_id }
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<PersonContact>}
   */
  async updatePrimaryPhone(contactId, phoneData, options = {}) {
    return await this.update(contactId, {
      phone_primary: phoneData.phone_primary,
      phone_primary_prefix_id: phoneData.phone_primary_prefix_id,
      phone_primary_verified_at: null // Requiere verificación nuevamente
    }, options);
  }

  /**
   * Actualiza el teléfono secundario
   * @param {string} contactId - UUID del contacto
   * @param {Object} phoneData - { phone_secondary, phone_secondary_prefix_id }
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<PersonContact>}
   */
  async updateSecondaryPhone(contactId, phoneData, options = {}) {
    return await this.update(contactId, {
      phone_secondary: phoneData.phone_secondary,
      phone_secondary_prefix_id: phoneData.phone_secondary_prefix_id,
      phone_secondary_verified_at: null // Requiere verificación nuevamente
    }, options);
  }

  /**
   * Busca contacto por teléfono primario
   * @param {string} phone - Número de teléfono
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<PersonContact|null>}
   */
  async findByPrimaryPhone(phone, options = {}) {
    return await this.findOne(
      { phone_primary: phone },
      options
    );
  }

  /**
   * Busca contacto por teléfono secundario
   * @param {string} phone - Número de teléfono
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<PersonContact|null>}
   */
  async findBySecondaryPhone(phone, options = {}) {
    return await this.findOne(
      { phone_secondary: phone },
      options
    );
  }

  /**
   * Busca contactos por prefijo telefónico
   * @param {string} prefixId - UUID del prefijo
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonContact[], count: number}>}
   */
  async findByPhonePrefix(prefixId, paginationParams = {}) {
    const { Op } = require('sequelize');
    
    return await this.findAllPaginated(
      {
        [Op.or]: [
          { phone_primary_prefix_id: prefixId },
          { phone_secondary_prefix_id: prefixId }
        ]
      },
      paginationParams,
      {},
      { include: this.getBasicInclude() }
    );
  }

  /**
   * Busca contactos con emails verificados
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: PersonContact[], count: number}>}
   */
  async findVerifiedEmails(paginationParams = {}) {
    const { Op } = require('sequelize');
    
    return await this.findAllPaginated(
      { email_verified_at: { [Op.ne]: null } },
      paginationParams
    );
  }

  /**
   * Cuenta contactos con email verificado
   * @returns {Promise<number>}
   */
  async countVerifiedEmails() {
    const { Op } = require('sequelize');
    return await this.count({ email_verified_at: { [Op.ne]: null } });
  }

  /**
   * Cuenta contactos con teléfono primario verificado
   * @returns {Promise<number>}
   */
  async countVerifiedPrimaryPhones() {
    const { Op } = require('sequelize');
    return await this.count({ phone_primary_verified_at: { [Op.ne]: null } });
  }
}

module.exports = PersonContactRepository;