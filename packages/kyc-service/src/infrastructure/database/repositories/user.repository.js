'use strict';

const { BaseRepository } = require('@abundbank/shared');
const bcrypt = require('bcryptjs');

class UserRepository extends BaseRepository {
  constructor(model, models) {
    super(model);
    this.models = models;
  }

  // ==================== STATIC INCLUDES (para uso en services) ====================
  
  static get INCLUDES() {
    return {
      minimal: [],
      basic: 'basic',
      full: 'full'
    };
  }

  // Getter de instancia que devuelve los includes reales
  get INCLUDES() {
    return {
      minimal: this.getMinimalInclude(),
      basic: this.getBasicInclude(),
      full: this.getFullInclude()
    };
  }

  // ==================== INCLUDES REUTILIZABLES ====================

  /**
   * Include mínimo: solo datos esenciales del usuario
   * Uso: Para refresh token, validaciones rápidas
   */
  getMinimalInclude() {
    return [];
  }

  /**
   * Include básico: Person, Role, Avatar (sin relaciones profundas)
   * Uso: Para login, autenticación básica
   */
  getBasicInclude() {
    return [
      {
        model: this.models.Person,
        as: 'person',
        attributes: ['id', 'first_name', 'last_name', 'national_id', 'birth_date'],
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
          }
        ]
      },
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
    ];
  }

  /**
   * Include completo: Todo el perfil del usuario
   * Uso: Para mostrar perfil completo, dashboard
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
            attributes: ['id', 'name', 'code', 'icon_url']
          },
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
          }
        ]
      },
      {
        model: this.models.Role,
        as: 'role'
      },
      {
        model: this.models.Avatar,
        as: 'avatar',
        include: [
          {
            model: this.models.AvatarTheme,
            as: 'avatar_theme'
          }
        ]
      }
    ];
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Busca usuario por nationalId con diferentes niveles de include
   * @param {string} nationalId - Cédula/RUT/DNI del usuario
   * @param {string} includeLevel - 'minimal' | 'basic' | 'full'
   * @returns {Promise<User|null>}
   */
  async findByUsernameAndNationalId(nationalId, includeLevel = 'basic') {
    const includeMap = {
      minimal: this.getMinimalInclude(),
      basic: this.getBasicInclude(),
      full: this.getFullInclude()
    };

    const include = includeMap[includeLevel] || this.getBasicInclude();

    return await this.findOne(
      {},
      {
        include: [
          {
            model: this.models.Person,
            as: 'person',
            where: { national_id: nationalId },
            required: true,
            ...((includeLevel === 'basic' || includeLevel === 'full') ? {
              include: include.find(inc => inc.model === this.models.Person)?.include || []
            } : {})
          },
          ...(includeLevel !== 'minimal' ? include.filter(inc => inc.model !== this.models.Person) : [])
        ]
      }
    );
  }

  /**
   * Busca usuario por ID con include completo
   * @param {string} userId - UUID del usuario
   * @returns {Promise<User|null>}
   */
  async findByIdComplete(userId) {
    return await this.findById(userId, {
      include: this.getFullInclude()
    });
  }

  /**
   * Busca usuario por cognito_sub
   * @param {string} cognitoSub - Sub de Cognito
   * @param {string} includeLevel - 'minimal' | 'basic' | 'full'
   * @returns {Promise<User|null>}
   */
  async findByCognitoSub(cognitoSub, includeLevel = 'basic') {
    const includeMap = {
      minimal: this.getMinimalInclude(),
      basic: this.getBasicInclude(),
      full: this.getFullInclude()
    };

    return await this.findOne(
      { cognito_sub: cognitoSub },
      { include: includeMap[includeLevel] || this.getBasicInclude() }
    );
  }

  /**
   * Busca usuario por cognito_username
   * @param {string} cognitoUsername - Username de Cognito
   * @param {string} includeLevel - 'minimal' | 'basic' | 'full'
   * @returns {Promise<User|null>}
   */
  async findByCognitoUsername(cognitoUsername, includeLevel = 'basic') {
    const includeMap = {
      minimal: this.getMinimalInclude(),
      basic: this.getBasicInclude(),
      full: this.getFullInclude()
    };

    return await this.findOne(
      { cognito_username: cognitoUsername },
      { include: includeMap[includeLevel] || this.getBasicInclude() }
    );
  }

  /**
   * Busca usuario por cognito_username
   * @param {string} cognitoUsername - Username de Cognito
   * @param {string} includeLevel - 'minimal' | 'basic' | 'full'
   * @returns {Promise<User|null>}
   */
  async findByCognitoUsername(cognitoUsername, includeLevel = 'basic') {
    const includeMap = {
      minimal: this.getMinimalInclude(),
      basic: this.getBasicInclude(),
      full: this.getFullInclude()
    };

    return await this.findOne(
      { cognito_username: cognitoUsername },
      { include: includeMap[includeLevel] || this.getBasicInclude() }
    );
  }

  /**
   * Busca usuario por username (visible, puede cambiar)
   * @param {string} username - Username visible del usuario
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<User|null>}
   */
  async findByUsername(username, options = {}) {
    return await this.findOne(
      { username },
      options
    );
  }

  /**
   * Activa o desactiva un usuario
   * @param {string} userId - UUID del usuario
   * @param {boolean} isActive - Estado activo
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<User>}
   */
  async setActiveStatus(userId, isActive, options = {}) {
    return await this.update(userId, {
      is_active: isActive
    }, options);
  }

  /**
   * Verifica si una contraseña coincide con el hash
   * @param {string} plainPassword - Contraseña en texto plano
   * @param {string} hashedPassword - Hash almacenado
   * @returns {Promise<boolean>}
   */
  async verifyPassword(plainPassword, hashedPassword) {
    if (!hashedPassword) return false;
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Actualiza la contraseña de un usuario
   * @param {string} userId - UUID del usuario
   * @param {string} newPassword - Nueva contraseña en texto plano
   * @param {Object} options - Opciones de Sequelize (transaction, etc.)
   * @returns {Promise<User>}
   */
  async updatePassword(userId, newPassword, options = {}) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    return await this.update(userId, {
      password_hash: hashedPassword
    }, options);
  }

  /**
   * Actualiza el estado TOTP del usuario
   * @param {string} userId - UUID del usuario
   * @param {boolean} enabled - Estado del TOTP
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<User>}
   */
  async updateTOTPStatus(userId, enabled, options = {}) {
    return await this.update(userId, {
      totp_enabled: enabled
    }, options);
  }

  /**
   * Actualiza el cognito_sub de un usuario
   * @param {string} userId - UUID del usuario
   * @param {string} cognitoSub - Sub de Cognito
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<User>}
   */
  async updateCognitoSub(userId, cognitoSub, options = {}) {
    return await this.update(userId, {
      cognito_sub: cognitoSub
    }, options);
  }

  /**
   * Verifica si existe un usuario con el email dado
   * @param {string} email - Email a verificar
   * @returns {Promise<boolean>}
   */
  async existsByEmail(email) {
    const count = await this.model.count({
      include: [
        {
          model: this.models.Person,
          as: 'person',
          required: true,
          include: [
            {
              model: this.models.PersonContact,
              as: 'contact',
              where: { email },
              required: true
            }
          ]
        }
      ]
    });

    return count > 0;
  }

  /**
   * Busca usuarios activos con paginación
   * @param {Object} criteria - Criterios de búsqueda adicionales
   * @param {Object} paginationParams - { limit, offset, sortBy, order }
   * @returns {Promise<{rows: User[], count: number}>}
   */
  async findActiveUsers(criteria = {}, paginationParams = {}) {
    return await this.findAllPaginated(
      { is_active: true, ...criteria },
      paginationParams,
      {},
      { include: this.getBasicInclude() }
    );
  }

  /**
   * Busca usuarios con paginación, filtros y búsqueda en campos relacionados
   * @param {Object} filters - Filtros (isActive, roleId)
   * @param {Object} paginationParams - Parámetros de paginación
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<{rows: User[], count: number}>}
   */
  async findAllPaginatedWithSearch(filters = {}, paginationParams = {}, searchTerm = null) {
    const criteria = {};

    // Aplicar filtros
    if (filters.isActive !== undefined) {
      criteria.is_active = filters.isActive;
    }
    if (filters.roleId) {
      criteria.role_id = filters.roleId;
    }

    // Configurar búsqueda en campos relacionados usando $association.field$
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

    return await this.findAllPaginated(
      criteria,
      paginationParams,
      searchConfig,
      {
        include: this.getBasicInclude(),
        subQuery: false // Importante para búsqueda en campos relacionados
      }
    );
  }
}

module.exports = UserRepository;