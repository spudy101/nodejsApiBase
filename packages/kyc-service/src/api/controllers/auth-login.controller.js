'use strict';

const authService = require('../../core/services/auth-login.service');
const { ApiResponse } = require('@abundbank/shared');
const { AppError } = require('@abundbank/shared');

class AuthController {

  /**
   * Login user
   * POST /<admin>o<client>/api/auth/login
   */
  async login(req, res, next) {
    try {
      const result = await authService.login(req.body, res.locals.auditContext);
      return ApiResponse.success(res, 'Login exitoso', result);
    } catch (error) {
      next(error);
    }
  }

  async verifyMFA(req, res, next) {
    try {
      const result = await authService.verifyMFA(req.body, res.locals.auditContext);
      return ApiResponse.success(res, 'Verificación MFA exitosa', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /<admin>o<client>/api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.headers['x-refresh-token'];

      const result = await authService.refreshToken(
        refreshToken,
        req.body.nationalId,
        res.locals.deviceFingerprint
      );

      return ApiResponse.success(res, 'Token renovado exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /<admin>o<client>/api/auth/logout
   */
  async logout(req, res, next) {
    try {
      await authService.logout(
        req.user.userId,
        res.locals.deviceFingerprint
      );
      return ApiResponse.success(res, 'Logout exitoso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout from all devices
   * POST /<admin>o<client>/api/auth/logout-all
   */
  async logoutAll(req, res, next) {
    try {
      const result = await authService.logoutAll(req.user.userId);
      return ApiResponse.success(res, 'Logout exitoso en todos los dispositivos', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active sessions
   * GET /<admin>o<client>/api/auth/sessions
   */
  async getActiveSessions(req, res, next) {
    try {
      const result = await authService.getActiveSessions(
        req.user.userId,
        res.locals.deviceFingerprint
      );
      return ApiResponse.success(res, 'Sesiones activas', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout from specific device
   * DELETE /<admin>o<client>/api/auth/sessions/:deviceFingerprint
   */
  async logoutDevice(req, res, next) {
    try {
      const { deviceFingerprint } = req.params;

      if (deviceFingerprint === res.locals.deviceFingerprint) {
        throw AppError.badRequest(
          'No puedes cerrar tu sesión actual desde aquí. Usa /<admin>o<client>/api/auth/logout'
        );
      }

      await authService.logoutDevice(
        req.user.userId,
        deviceFingerprint
      );

      return ApiResponse.success(res, 'Dispositivo desconectado');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();