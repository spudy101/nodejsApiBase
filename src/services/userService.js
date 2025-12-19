const { User } = require('../models');
const { sequelize } = require('../models');
const { executeWithTransaction, executeQuery } = require('../utils/transactionWrapper');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class UserService {
  /**
   * Listar todos los usuarios con paginación y filtros
   */
  async listUsers(filters = {}) {
    return executeQuery(
      async () => {
        const {
          page = 1,
          limit = 10,
          role,
          isActive,
          search
        } = filters;

        const offset = (page - 1) * limit;

        // Construir condiciones WHERE
        const where = {};

        if (role) {
          where.role = role;
        }

        if (typeof isActive === 'boolean') {
          where.isActive = isActive;
        }

        if (search) {
          where[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
          ];
        }

        // Obtener usuarios y total
        const { count, rows } = await User.findAndCountAll({
          where,
          attributes: { exclude: ['password'] },
          limit,
          offset,
          order: [['createdAt', 'DESC']]
        });

        logger.debug('Usuarios listados', { 
          total: count, 
          page, 
          limit 
        });

        return {
          users: rows.map(user => user.toJSON()),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        };
      },
      'listUsers',
      sequelize
    );
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(userId) {
    return executeQuery(
      async () => {
        const user = await User.findByPk(userId, {
          attributes: { exclude: ['password'] }
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        logger.debug('Usuario obtenido por ID', { userId });

        return user.toJSON();
      },
      'getUserById',
      sequelize
    );
  }

  /**
   * Obtener usuario por email
   */
  async getUserByEmail(email) {
    return executeQuery(
      async () => {
        const user = await User.findOne({
          where: { email },
          attributes: { exclude: ['password'] }
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        logger.debug('Usuario obtenido por email', { email });

        return user.toJSON();
      },
      'getUserByEmail',
      sequelize
    );
  }

  /**
   * Actualizar rol de usuario (solo admin)
   */
  async updateUserRole(userId, newRole) {
    return executeWithTransaction(
      { userId, newRole },
      async (data, transaction) => {
        const user = await User.findByPk(data.userId, { transaction });

        if (!user) {
          return {
            _rollback: true,
            message: 'Usuario no encontrado',
            data: null
          };
        }

        const oldRole = user.role;
        user.role = data.newRole;
        await user.save({ transaction });

        logger.info('Rol de usuario actualizado', { 
          userId: user.id, 
          oldRole, 
          newRole: data.newRole 
        });

        return user.toJSON();
      },
      'updateUserRole',
      { sequelize }
    );
  }

  /**
   * Eliminar usuario permanentemente (hard delete)
   */
  async deleteUser(userId) {
    return executeWithTransaction(
      { userId },
      async (data, transaction) => {
        const user = await User.findByPk(data.userId, { transaction });

        if (!user) {
          return {
            _rollback: true,
            message: 'Usuario no encontrado',
            data: null
          };
        }

        await user.destroy({ transaction });

        logger.warn('Usuario eliminado permanentemente', { userId: user.id });

        return { message: 'Usuario eliminado permanentemente' };
      },
      'deleteUser',
      { sequelize }
    );
  }

  /**
   * Obtener estadísticas de usuarios
   */
  async getUserStats() {
    return executeQuery(
      async () => {
        const [stats] = await sequelize.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE "isActive" = true) as active,
            COUNT(*) FILTER (WHERE "isActive" = false) as inactive,
            COUNT(*) FILTER (WHERE role = 'admin') as admins,
            COUNT(*) FILTER (WHERE role = 'user') as users
          FROM "Users"
        `);

        logger.debug('Estadísticas de usuarios obtenidas');

        return stats[0];
      },
      'getUserStats',
      sequelize
    );
  }
}

module.exports = new UserService();