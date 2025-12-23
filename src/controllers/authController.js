const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

class AuthController {
  /**
   * Registrar nuevo usuario
   * POST /api/v1/auth/register
   */
  async register(req, res, next) {
    try {
      const { email, password, name, role } = req.body;

      const result = await authService.register({
        email,
        password,
        name,
        role
      });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      logger.info('Usuario registrado desde controller', { 
        email: result.data.user.email 
      });

      return successResponse(
        res,
        result.data,
        'Usuario registrado exitosamente',
        201
      );

    } catch (error) {
      logger.error('Error en register controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Login de usuario
   * POST /api/v1/auth/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      if (!result.success) {
        return errorResponse(res, result.message, 401);
      }

      logger.info('Usuario logueado desde controller', { 
        email: result.data.user.email 
      });

      return successResponse(
        res,
        result.data,
        'Inicio de sesión exitoso',
        200
      );

    } catch (error) {
      logger.error('Error en login controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Errores específicos de login
      if (error.message === 'Credenciales inválidas' || error.message === 'Usuario inactivo') {
        return errorResponse(res, error.message, 401);
      }
      
      next(error);
    }
  }

  /**
   * Obtener perfil del usuario autenticado
   * GET /api/v1/auth/profile
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await authService.getProfile(userId);

      if (!result.success) {
        return errorResponse(res, result.message, 404);
      }

      return successResponse(
        res,
        result.data,
        'Perfil obtenido exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en getProfile controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Actualizar perfil del usuario autenticado
   * PUT /api/v1/auth/profile
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { name, email } = req.body;

      const result = await authService.updateProfile(userId, { name, email });

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Perfil actualizado exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en updateProfile controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Cambiar contraseña del usuario autenticado
   * PUT /api/v1/auth/change-password
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const result = await authService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Contraseña actualizada exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en changePassword controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Desactivar cuenta del usuario autenticado
   * DELETE /api/v1/auth/account
   */
  async deactivateAccount(req, res, next) {
    try {
      const userId = req.user.id;

      const result = await authService.deactivateUser(userId);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Cuenta desactivada exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en deactivateAccount controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }
}

module.exports = new AuthController();