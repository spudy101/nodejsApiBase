'use strict';

const BaseRepository = require('../../../shared/repositories/base.repository');
const AppError       = require('../../../shared/utils/app-error.util');
const bcrypt         = require('bcryptjs');
const { User }       = require('../../../shared/models');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  // ============================================================
  // INCLUDES CENTRALIZADOS
  // ============================================================

  static INCLUDES = {

    /**
     * login — lo mínimo para completar el proceso de login
     */
    login: [
      {
        association: 'person',
        required:    true,
        include: [
          { association: 'contact', required: false },
        ],
      },
      { association: 'role',   required: true },
      { association: 'avatar', required: false },
    ],

    /**
     * minimal — solo datos de identidad básicos
     * Usado en refresh token y operaciones que solo necesitan cognito_username + person/contact
     */
    minimal: [
      {
        association: 'person',
        required:    false,
        include: [
          { association: 'contact', required: false },
        ],
      },
    ],

    /**
     * basic — perfil básico para el cliente
     * User + Person + Contact + Avatar + Role
     */
    basic: [
      {
        association: 'person',
        required:    false,
        include: [
          {
            association: 'contact',
            required:    false,
            include: [
              { association: 'primaryPrefix'   },
              { association: 'secondaryPrefix' },
            ],
          },
        ],
      },
      { association: 'role'   },
      { association: 'avatar' },
    ],

    /**
     * full — perfil completo para el cliente
     * Agrega Location + Gender + Nationality sobre el basic
     */
    full: [
      {
        association: 'person',
        required:    false,
        include: [
          {
            association: 'contact',
            required:    false,
            include: [
              { association: 'primaryPrefix'   },
              { association: 'secondaryPrefix' },
            ],
          },
          { association: 'gender'      },
          { association: 'nationality' },
          {
            association: 'location',
            required:    false,
            include: [
              { association: 'country'    },
              { association: 'department' },
              { association: 'city'       },
            ],
          },
        ],
      },
      { association: 'role'   },
      { association: 'avatar' },
    ],

    /**
     * profile — alias de full, usado por el admin y findAllPaginated
     */
    profile: [
      {
        association: 'person',
        include: [
          {
            association: 'contact',
            include: [
              { association: 'primaryPrefix'   },
              { association: 'secondaryPrefix' },
            ],
          },
          { association: 'gender'      },
          { association: 'nationality' },
          {
            association: 'location',
            include: [
              { association: 'country'     },
              { association: 'department'  },
              { association: 'city'        },
            ],
          },
        ],
      },
      { association: 'role'   },
      { association: 'avatar' },
    ],
  };

  // ============================================================
  // QUERIES
  // ============================================================

  async findByNationalIdForLogin(nationalId) {
    return await this.findOne(
      { '$person.national_id$': nationalId },
      { include: UserRepository.INCLUDES.login }
    );
  }

  async findByNationalId(nationalId, includeLevel = 'minimal') {
    return await this.findOne(
      { '$person.national_id$': nationalId },
      { include: UserRepository.INCLUDES[includeLevel] }
    );
  }

  /**
   * @param {string} userId
   * @param {'minimal'|'basic'|'full'|'profile'|'login'} includeLevel
   */
  async findByUserId(userId, includeLevel = 'basic') {
    return await this.findOne(
      { id: userId },
      { include: UserRepository.INCLUDES[includeLevel] }
    );
  }

  async findByPersonId(personId, includeLevel = 'minimal') {
    return await this.findOne(
      { person_id: personId },
      { include: UserRepository.INCLUDES[includeLevel] }
    );
  }

  async findAllPaginated(filters = {}, pagination = {}, searchTerm = null) {
    const criteria = {};

    if (filters.isActive !== undefined) criteria.is_active = filters.isActive;
    if (filters.roleId)                 criteria.role_id   = filters.roleId;

    return await super.findAllPaginated(
      criteria,
      pagination,
      {
        searchTerm,
        searchFields: [
          '$person.first_name$',
          '$person.last_name$',
          '$person.national_id$',
          '$person.contact.email$',
        ],
      },
      { include: UserRepository.INCLUDES.profile }
    );
  }

  // ============================================================
  // MUTATIONS
  // ============================================================

  async create(userData, options = {}) {
    const passwordHash = await this._hashPassword(userData.password);

    return await super.create({
      username:         userData.username,
      password_hash:    passwordHash,
      person_id:        userData.person_id,
      role_id:          userData.role_id,
      avatar_id:        userData.avatar_id        || null,
      cognito_sub:      userData.cognito_sub       || null,
      cognito_username: userData.cognito_username  || null,
      is_active:        true,
      totp_enabled:     false,
    }, options);
  }

  async updateCognitoSub(userId, cognitoSub) {
    const updated = await this.update(userId, { cognito_sub: cognitoSub });
    if (!updated) throw AppError.notFound('Usuario no encontrado');
    return updated;
  }

  async updatePassword(userId, newPassword, options = {}) {
    const passwordHash = await this._hashPassword(newPassword);
    return await this.update(userId, { password_hash: passwordHash }, options);
  }

  async updateTOTPStatus(userId, enabled, options = {}) {
    const updated = await this.update(userId, { totp_enabled: enabled }, options);
    if (!updated) throw AppError.notFound('Usuario no encontrado');
    return updated;
  }

  async setActiveStatus(userId, isActive, options = {}) {
    return await this.update(userId, { is_active: isActive }, options);
  }

  // ============================================================
  // HELPERS
  // ============================================================

  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  async _hashPassword(password) {
    return await bcrypt.hash(password, 10);
  }
}

module.exports = new UserRepository();