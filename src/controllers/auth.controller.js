// src/controllers/auth.controller.js
const authService = require('../services/auth.service');
const { RegisterDTO, LoginDTO, RefreshTokenDTO } = require('../dto/auth.dto');
const ApiResponse = require('../utils/response');
const { SUCCESS } = require('../constants/messages');

class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  async register(req, res, next) {
    try {
      // Convertir req.body a DTO (sanitiza y valida estructura)
      const registerDTO = RegisterDTO.fromRequest(req.body);
      
      // Llamar al servicio con DTO
      const result = await authService.register(registerDTO, res.locals.auditContext);
      
      // Responder con formato consistente
      return ApiResponse.created(res, SUCCESS.USER_REGISTERED, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      // Convertir req.body a DTO (solo email y password)
      const loginDTO = LoginDTO.fromRequest(req.body);
      
      // Llamar al servicio con DTO
      const result = await authService.login(loginDTO, res.locals.auditContext);
      
      // Responder con formato consistente
      return ApiResponse.success(res, SUCCESS.LOGIN_SUCCESS, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  async logout(req, res, next) {
    try {
      // Extraer token del header
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      // Llamar al servicio
      const result = await authService.logout(
        req.user.id, 
        token, 
        res.locals.auditContext
      );
      
      // Responder con mensaje de éxito
      return ApiResponse.success(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  async refreshToken(req, res, next) {
    try {
      // Convertir req.body a DTO
      const refreshTokenDTO = RefreshTokenDTO.fromRequest(req.body);
      
      // Llamar al servicio con DTO
      const result = await authService.refreshToken(
        refreshTokenDTO, 
        res.locals.auditContext
      );
      
      // Responder con nuevos tokens
      return ApiResponse.success(res, 'Token renovado exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify token validity
   * GET /api/auth/verify
   */
  async verifyToken(req, res, next) {
    try {
      // Extraer token del header
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      // Verificar token
      const result = await authService.verifyToken(token);
      
      // Responder con resultado
      return ApiResponse.success(res, 'Token verificado', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user profile
   * GET /api/auth/me
   */
  async me(req, res, next) {
    try {
      // req.user viene del middleware de autenticación
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
}

module.exports = new AuthController();
