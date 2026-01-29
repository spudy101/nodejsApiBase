'use strict';

const { BaseRepository } = require('@abundbank/shared');

class AvatarRepository extends BaseRepository {
  constructor(model, models) {
    super(model);
    this.models = models;
  }

  // ==================== INCLUDES REUTILIZABLES ====================

  /**
   * Include con tema de avatar
   */
  getWithThemeInclude() {
    return [
      {
        model: this.models.AvatarTheme,
        as: 'avatar_theme',
        attributes: ['id', 'name']
      }
    ];
  }

  /**
   * Include con usuarios (para estadísticas)
   */
  getWithUsersInclude() {
    return [
      {
        model: this.models.AvatarTheme,
        as: 'avatar_theme',
        attributes: ['id', 'name']
      },
      {
        model: this.models.User,
        as: 'users',
        attributes: ['id', 'username']
      }
    ];
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Busca avatar por ID con tema incluido
   * @param {string} avatarId - UUID del avatar
   * @returns {Promise<Avatar|null>}
   */
  async findByIdWithTheme(avatarId) {
    return await this.findById(avatarId, {
      include: this.getWithThemeInclude()
    });
  }

  /**
   * Busca avatares activos
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Avatar[]>}
   */
  async findAllActive(options = {}) {
    return await this.findAll(
      { is_active: true },
      {
        include: this.getWithThemeInclude(),
        order: [['name', 'ASC']],
        ...options
      }
    );
  }

  /**
   * Busca avatares por tema
   * @param {string} themeId - UUID del tema
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: Avatar[], count: number}>}
   */
  async findByTheme(themeId, paginationParams = {}) {
    return await this.findAllPaginated(
      { avatar_theme_id: themeId },
      paginationParams,
      {},
      { include: this.getWithThemeInclude() }
    );
  }

  /**
   * Busca avatares activos por tema
   * @param {string} themeId - UUID del tema
   * @returns {Promise<Avatar[]>}
   */
  async findActiveByTheme(themeId) {
    return await this.findAll(
      { 
        avatar_theme_id: themeId,
        is_active: true 
      },
      {
        include: this.getWithThemeInclude(),
        order: [['name', 'ASC']]
      }
    );
  }

  /**
   * Busca avatar por nombre
   * @param {string} name - Nombre del avatar
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Avatar|null>}
   */
  async findByName(name, options = {}) {
    return await this.findOne(
      { name },
      {
        include: this.getWithThemeInclude(),
        ...options
      }
    );
  }

  /**
   * Verifica si existe un avatar con el nombre dado
   * @param {string} name - Nombre del avatar
   * @returns {Promise<boolean>}
   */
  async existsByName(name) {
    return await this.exists({ name });
  }

  /**
   * Activa o desactiva un avatar
   * @param {string} avatarId - UUID del avatar
   * @param {boolean} isActive - Estado activo
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<Avatar>}
   */
  async setActiveStatus(avatarId, isActive, options = {}) {
    return await this.update(avatarId, {
      is_active: isActive
    }, options);
  }

  /**
   * Actualiza la URL de imagen de un avatar
   * @param {string} avatarId - UUID del avatar
   * @param {string} imageUrl - Nueva URL de imagen
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<Avatar>}
   */
  async updateImageUrl(avatarId, imageUrl, options = {}) {
    return await this.update(avatarId, {
      image_url: imageUrl
    }, options);
  }

  /**
   * Actualiza el tema de un avatar
   * @param {string} avatarId - UUID del avatar
   * @param {string} themeId - UUID del nuevo tema
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<Avatar>}
   */
  async updateTheme(avatarId, themeId, options = {}) {
    return await this.update(avatarId, {
      avatar_theme_id: themeId
    }, options);
  }

  /**
   * Cuenta avatares activos
   * @returns {Promise<number>}
   */
  async countActive() {
    return await this.count({ is_active: true });
  }

  /**
   * Cuenta avatares por tema
   * @param {string} themeId - UUID del tema
   * @returns {Promise<number>}
   */
  async countByTheme(themeId) {
    return await this.count({ avatar_theme_id: themeId });
  }

  /**
   * Cuenta usuarios usando un avatar específico
   * @param {string} avatarId - UUID del avatar
   * @returns {Promise<number>}
   */
  async countUsers(avatarId) {
    return await this.model.count({
      where: { id: avatarId },
      include: [
        {
          model: this.models.User,
          as: 'users',
          attributes: []
        }
      ]
    });
  }

  /**
   * Obtiene avatares con conteo de usuarios
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<Array>}
   */
  async getAvatarsWithUserCount(paginationParams = {}) {
    const { rows, count } = await this.findAllPaginated(
      {},
      paginationParams,
      {},
      { include: this.getWithUsersInclude() }
    );

    const avatarsWithCount = rows.map(avatar => ({
      id: avatar.id,
      name: avatar.name,
      image_url: avatar.image_url,
      is_active: avatar.is_active,
      avatar_theme: avatar.avatar_theme,
      user_count: avatar.users ? avatar.users.length : 0
    }));

    return { rows: avatarsWithCount, count };
  }

  /**
   * Busca avatares por nombre (búsqueda parcial)
   * @param {string} searchTerm - Término de búsqueda
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: Avatar[], count: number}>}
   */
  async searchByName(searchTerm, paginationParams = {}) {
    return await this.findAllPaginated(
      {},
      paginationParams,
      {
        searchTerm,
        searchFields: ['name']
      },
      { include: this.getWithThemeInclude() }
    );
  }

  /**
   * Obtiene el avatar por defecto (si existe)
   * @returns {Promise<Avatar|null>}
   */
  async findDefault() {
    return await this.findOne(
      { 
        name: 'default',
        is_active: true 
      },
      { include: this.getWithThemeInclude() }
    );
  }

  /**
   * Obtiene avatares más usados
   * @param {number} limit - Límite de resultados
   * @returns {Promise<Array>}
   */
  async getMostUsed(limit = 10) {
    const avatars = await this.model.findAll({
      include: [
        {
          model: this.models.AvatarTheme,
          as: 'avatar_theme',
          attributes: ['id', 'name']
        },
        {
          model: this.models.User,
          as: 'users',
          attributes: []
        }
      ],
      attributes: [
        'id',
        'name',
        'image_url',
        'is_active',
        [this.model.sequelize.fn('COUNT', this.model.sequelize.col('users.id')), 'user_count']
      ],
      group: ['Avatar.id', 'avatar_theme.id'],
      order: [[this.model.sequelize.literal('user_count'), 'DESC']],
      limit,
      subQuery: false
    });

    return avatars;
  }
}

module.exports = AvatarRepository;