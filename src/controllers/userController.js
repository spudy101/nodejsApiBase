const userService = require('../services/userService');
const authService = require('../services/authService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

class UserController {
  /**
   * Listar todos los usuarios (Admin)
   * GET /api/v1/users
   */
  async listUsers(req, res, next) {
    try {
      const { page, limit, role, isActive, search } = req.query;

      const result = await userService.listUsers({
        page,
        limit,
        role,
        isActive,
        search
      });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return paginatedResponse(
        res,
        result.data.users,
        result.data.pagination.page,
        result.data.pagination.limit,
        result.data.pagination.total,
        'Usuarios obtenidos exitosamente'
      );

    } catch (error) {
      logger.error('Error en listUsers controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Obtener usuario por ID (Admin)
   * GET /api/v1/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await userService.getUserById(id);

      if (!result.success) {
        return errorResponse(res, result.message, 404);
      }

      return successResponse(
        res,
        result.data,
        'Usuario obtenido exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en getUserById controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      if (error.message === 'Usuario no encontrado') {
        return errorResponse(res, error.message, 404);
      }
      
      next(error);
    }
  }

  /**
   * Actualizar rol de usuario (Admin)
   * PUT /api/v1/users/:id/role
   */
  async updateUserRole(req, res, next) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      const result = await userService.updateUserRole(id, role);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Rol actualizado exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en updateUserRole controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Activar usuario (Admin)
   * PUT /api/v1/users/:id/activate
   */
  async activateUser(req, res, next) {
    try {
      const { id } = req.params;

      const result = await authService.activateUser(id);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Usuario activado exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en activateUser controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Desactivar usuario (Admin)
   * PUT /api/v1/users/:id/deactivate
   */
  async deactivateUser(req, res, next) {
    try {
      const { id } = req.params;

      const result = await authService.deactivateUser(id);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Usuario desactivado exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en deactivateUser controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Eliminar usuario permanentemente (Admin)
   * DELETE /api/v1/users/:id
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const result = await userService.deleteUser(id);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Usuario eliminado permanentemente',
        200
      );

    } catch (error) {
      logger.error('Error en deleteUser controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Obtener estadísticas de usuarios (Admin)
   * GET /api/v1/users/stats
   */
  async getUserStats(req, res, next) {
    try {
      const result = await userService.getUserStats();

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Estadísticas obtenidas exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en getUserStats controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }
}

module.exports = new UserController();