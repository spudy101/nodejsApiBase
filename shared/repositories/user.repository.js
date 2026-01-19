'use strict';

const BaseRepository = require('./base.repository');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError.util');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  // Includes comunes centralizados
  static INCLUDES = {
    full: [
      { 
        association: 'person', 
        include: [
          { 
            association: 'contact', 
            include: [
              { association: 'phone_primary_prefix' }, 
              { association: 'phone_secondary_prefix' }
            ] 
          }, 
          { association: 'gender' }, 
          { association: 'country' }, 
          { 
            association: 'location', 
            include: [
              { association: 'country' }, 
              { association: 'city' }, 
              { association: 'department' }
            ] 
          }, 
          { 
            association: 'social_networks', 
            include: [{ association: 'provider' }] 
          }
        ] 
      },
      { association: 'role' },
      { association: 'avatar' }
    ],
    basic: [
      { 
        association: 'person',
        include: [{ association: 'contact' }]
      },
      { association: 'role' },
      { association: 'avatar' }
    ],
    minimal: [{ association: 'person' }]
  };

  async findByUsername(username, includeLevel = 'basic') {
    return await this.findOne(
      { username },
      { include: UserRepository.INCLUDES[includeLevel] }
    );
  }

  async findByUsernameAndNationalId(nationalId, includeLevel = 'minimal') {
    return await this.findOne(
      { 
        '$person.national_id$': nationalId 
      },
      { include: UserRepository.INCLUDES[includeLevel] }
    );
  }

  async findByCognitoSub(cognitoSub, includeLevel = 'minimal') {
    return await this.findOne(
      { cognito_sub: cognitoSub },
      { include: UserRepository.INCLUDES[includeLevel] }
    );
  }

  /**
   * Busca usuarios con paginación, filtros y búsqueda
   * @param {Object} filters - Filtros (isActive, roleId)
   * @param {Object} paginationParams - Parámetros de paginación
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<{rows: Array, count: number}>}
   */
  async findAllPaginated(filters = {}, paginationParams = {}, searchTerm = null) {
    const criteria = {};

    // Aplicar filtros
    if (filters.isActive !== undefined) {
      criteria.is_active = filters.isActive;
    }
    if (filters.roleId) {
      criteria.role_id = filters.roleId;
    }

    // Configurar búsqueda en campos relacionados
    const searchConfig = {
      searchTerm,
      searchFields: [
        'username',
        '$person.first_name$',
        '$person.last_name$',
        '$person.national_id$',
        '$person.contact.email$'
      ],
    };

    return await super.findAllPaginated(
      criteria, 
      paginationParams, 
      searchConfig,
      {
        include: UserRepository.INCLUDES.basic,
      }
    );
  }

  async create(userData, options = {}) {
    const passwordHash = await this._hashPassword(userData.password);

    return await super.create({
      username: userData.username,
      password_hash: passwordHash,
      person_id: userData.person_id,
      role_id: userData.role_id,
      avatar_id: userData.avatar_id,
      cognito_sub: userData.cognito_sub || null,
      cognito_username: userData.cognito_username || null,
      is_active: true,
      totp_enabled: false,
    }, options);
  }

  async updateCognitoSub(userId, cognitoSub) {
    const updated = await this.update(userId, { cognito_sub: cognitoSub });
    if (!updated) {
      throw AppError.notFound('Usuario no encontrado');
    }
    return updated;
  }

  async updatePassword(userId, newPassword, options = {}) {
    const passwordHash = await this._hashPassword(newPassword);
    return await this.update(userId, { password_hash: passwordHash }, options);
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async setActiveStatus(userId, isActive, options = {}) {
    return await this.update(userId, { is_active: isActive }, options);
  }

  async setTOTPStatus(userId, enabled, totpSecret = null, options = {}) {
    return await this.update(
      userId,
      { totp_enabled: enabled, totp_secret: totpSecret },
      options
    );
  }

  // Override delete para usar user_id en vez de id
  async delete(userId) {
    return await this.model.destroy({ where: { user_id: userId } });
  }

  // Override findById para usar user_id
  async findById(userId, options = {}) {
    return await this.model.findByPk(userId, options);
  }

  // Método privado para hashear password
  async _hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }

  /**
   * Actualiza el estado de TOTP del usuario
   * @param {string} userId - ID del usuario
   * @param {boolean} enabled - true para activar, false para desactivar
   * @param {object} options - Opciones de Sequelize (transaction, etc)
   * @returns {Promise<User>}
   */
  async updateTOTPStatus(userId, enabled, options = {}) {
    const updated = await this.update(userId, { totp_enabled: enabled }, options);
    if (!updated) {
      throw AppError.notFound('Usuario no encontrado');
    }
    return updated;
  }
}

module.exports = new UserRepository();