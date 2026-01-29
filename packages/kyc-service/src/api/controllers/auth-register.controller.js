'use strict';

const AuthService = require('../../core/services/auth-register.service');
const { ApiResponse } = require('@abundbank/shared');

class AuthController {
  /**
   * Registrar nuevo usuario
   * POST /client/api/auth/register
   */
  async register(req, res, next) {
    try {
      const result = await AuthService.register(req.body);
      return ApiResponse.created(res, 'Usuario registrado exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Solicitar reset de credenciales (password o MFA)
   * POST /client/api/auth/reset-credentials/request
   */
  async requestResetCredentials(req, res, next) {
    try {
      await AuthService.requestResetCredentials(req.body);
      return ApiResponse.success(res, 'Si el email existe en nuestro sistema, recibirás un correo con instrucciones');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Confirmar reset de credenciales con token
   * POST /client/api/auth/reset-credentials/confirm
   */
  async confirmResetCredentials(req, res, next) {
    try {
      await AuthService.confirmResetCredentials(req.body);
      const message = req.body.type === 'password' 
        ? 'Contraseña actualizada exitosamente' 
        : 'MFA desactivado exitosamente';
      return ApiResponse.success(res, message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();