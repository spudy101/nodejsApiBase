'use strict';

const BaseRepository = require('./base.repository');
const db = require('../models'); // Ajusta la ruta según tu estructura

class RoleRepository extends BaseRepository {
  constructor() {
    super(db.Role); // Pasamos el modelo Role al constructor del BaseRepository
  }

  /**
   * Busca un rol por su ID (role_id)
   * @param {string} roleId - UUID del rol
   * @param {Object} options - Opciones adicionales de Sequelize
   * @returns {Promise<Object|null>} - Rol encontrado o null
   */
  async findById(roleId, options = {}) {
    return await this.model.findByPk(roleId, options);
  }

  /**
   * Busca un rol por su nombre
   * @param {string} name - Nombre del rol
   * @param {Object} options - Opciones adicionales de Sequelize
   * @returns {Promise<Object|null>} - Rol encontrado o null
   */
  async findByName(name, options = {}) {
    return await this.findOne({ name }, options);
  }

  /**
   * Obtiene todos los roles activos
   * @param {Object} options - Opciones adicionales de Sequelize
   * @returns {Promise<Array>} - Array de roles activos
   */
  async findAllActive(options = {}) {
    return await this.findAll({ is_active: true }, options);
  }

  /**
   * Verifica si un rol existe por su nombre
   * @param {string} name - Nombre del rol
   * @returns {Promise<boolean>} - true si existe, false si no
   */
  async existsByName(name) {
    return await this.exists({ name });
  }

  /**
   * Crea un nuevo rol
   * @param {Object} roleData - Datos del rol { name, description, is_active }
   * @param {Object} options - Opciones adicionales de Sequelize
   * @returns {Promise<Object>} - Rol creado
   */
  async createRole(roleData, options = {}) {
    return await this.create(roleData, options);
  }

  /**
   * Actualiza un rol por su ID
   * @param {string} roleId - UUID del rol
   * @param {Object} updateData - Datos a actualizar
   * @param {Object} options - Opciones adicionales de Sequelize
   * @returns {Promise<Object|null>} - Rol actualizado o null
   */
  async updateRole(roleId, updateData, options = {}) {
    return await this.update(roleId, updateData, options);
  }

  /**
   * Desactiva un rol (soft delete)
   * @param {string} roleId - UUID del rol
   * @param {Object} options - Opciones adicionales de Sequelize
   * @returns {Promise<Object|null>} - Rol actualizado o null
   */
  async deactivateRole(roleId, options = {}) {
    return await this.update(roleId, { is_active: false }, options);
  }
}

// Exportar una única instancia (Singleton)
module.exports = new RoleRepository();