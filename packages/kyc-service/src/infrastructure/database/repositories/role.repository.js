'use strict';

const { BaseRepository } = require('@abundbank/shared');

class RoleRepository extends BaseRepository {
  constructor(model, models) {
    super(model);
    this.models = models;
  }

  // ==================== INCLUDES REUTILIZABLES ====================

  /**
   * Include con usuarios (solo para estadísticas)
   */
  getWithUsersInclude() {
    return [
      {
        model: this.models.User,
        as: 'users',
        attributes: ['id', 'username', 'is_active']
      }
    ];
  }

  // ==================== MÉTODOS ESPECÍFICOS ====================

  /**
   * Busca un rol por nombre
   * @param {string} name - Nombre del rol
   * @param {Object} options - Opciones adicionales de Sequelize
   * @returns {Promise<Role|null>}
   */
  async findByName(name, options = {}) {
    return await this.findOne(
      { name },
      options
    );
  }

  /**
   * Busca un rol activo por nombre
   * @param {string} name - Nombre del rol
   * @param {Object} options - Opciones adicionales
   * @returns {Promise<Role|null>}
   */
  async findActiveByName(name, options = {}) {
    return await this.findOne(
      { name, is_active: true },
      options
    );
  }

  /**
   * Verifica si existe un rol con el nombre dado
   * @param {string} name - Nombre del rol
   * @returns {Promise<boolean>}
   */
  async existsByName(name) {
    return await this.exists({ name });
  }

  /**
   * Obtiene todos los roles activos
   * @returns {Promise<Role[]>}
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
   * Cuenta usuarios por rol
   * @param {string} roleId - UUID del rol
   * @returns {Promise<number>}
   */
  async countUsers(roleId) {
    return await this.model.count({
      where: { id: roleId },
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
   * Activa o desactiva un rol
   * @param {string} roleId - UUID del rol
   * @param {boolean} isActive - Estado activo
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<Role>}
   */
  async setActiveStatus(roleId, isActive, options = {}) {
    return await this.update(roleId, {
      is_active: isActive
    }, options);
  }

  /**
   * Actualiza la descripción de un rol
   * @param {string} roleId - UUID del rol
   * @param {string} description - Nueva descripción
   * @param {Object} options - Opciones de Sequelize
   * @returns {Promise<Role>}
   */
  async updateDescription(roleId, description, options = {}) {
    return await this.update(roleId, {
      description
    }, options);
  }

  /**
   * Obtiene roles con conteo de usuarios
   * @returns {Promise<Array>}
   */
  async getRolesWithUserCount() {
    const roles = await this.findAll({}, {
      include: this.getWithUsersInclude(),
      order: [['name', 'ASC']]
    });

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      is_active: role.is_active,
      user_count: role.users ? role.users.length : 0
    }));
  }

  /**
   * Busca roles por nombre (búsqueda parcial)
   * @param {string} searchTerm - Término de búsqueda
   * @param {Object} paginationParams - Parámetros de paginación
   * @returns {Promise<{rows: Role[], count: number}>}
   */
  async searchByName(searchTerm, paginationParams = {}) {
    return await this.findAllPaginated(
      {},
      paginationParams,
      {
        searchTerm,
        searchFields: ['name', 'description']
      }
    );
  }
}

module.exports = RoleRepository;