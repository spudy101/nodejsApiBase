// src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const { RegisterDTO, LoginDTO, RefreshTokenDTO } = require('../dto/auth.dto');
const ApiResponse = require('../utils/response');
const { SUCCESS } = require('../constants/messages');

class AuthController {
  async register(req, res, next) {
    try {
      const registerDTO = RegisterDTO.fromRequest(req.body);
      const result = await authService.register(registerDTO, res.locals.auditContext);
      return ApiResponse.created(res, SUCCESS.USER_REGISTERED, result);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const loginDTO = LoginDTO.fromRequest(req.body);
      const result = await authService.login(loginDTO, res.locals.auditContext);
      return ApiResponse.success(res, SUCCESS.LOGIN_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');
      const refreshTokenDTO = RefreshTokenDTO.fromRequest(req.body);
      const result = await authService.logout(
        req.user.id,
        accessToken,
        refreshTokenDTO,
        res.locals.auditContext
      );
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req, res, next) {
    try {
      const refreshTokenDTO = RefreshTokenDTO.fromRequest(req.body);
      const result = await authService.refreshToken(
        refreshTokenDTO, 
        res.locals.auditContext
      );
      return ApiResponse.success(res, 'Token renovado exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      return ApiResponse.success(res, 'Usuario obtenido', {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 🔥 Get active sessions
   * GET /api/auth/sessions
   */
  async getSessions(req, res, next) {
    try {
      const sessions = await authService.getActiveSessions(
        req.user.id,
        res.locals.auditContext
      );
      return ApiResponse.success(res, 'Sesiones activas obtenidas', sessions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 🔥 Logout specific session
   * DELETE /api/auth/sessions/:sessionId
   */
  async logoutSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const result = await authService.logoutSession(
        req.user.id,
        sessionId,
        res.locals.auditContext
      );
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * 🔥 Logout all sessions
   * DELETE /api/auth/sessions
   */
  async logoutAllSessions(req, res, next) {
    try {
      const result = await authService.logoutAllSessions(
        req.user.id,
        res.locals.auditContext
      );
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();