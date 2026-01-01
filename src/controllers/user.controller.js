// src/controllers/user.controller.js
const userService = require('../services/user.service');
const { UpdateProfileDTO } = require('../dto/user.dto');
const ApiResponse = require('../utils/response');
const { SUCCESS } = require('../constants/messages');

class UserController {
  /**
   * Get current user profile
   * GET /api/users/profile
   */
  async getProfile(req, res, next) {
    try {
      const user = await userService.getProfile(
        req.user.id, 
        res.locals.auditContext
      );
      
      return ApiResponse.success(
        res,
        'Perfil obtenido exitosamente',
        user
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /api/users/profile
   */
  async updateProfile(req, res, next) {
    try {
      // Convertir req.body a DTO
      const updateDTO = UpdateProfileDTO.fromRequest(req.body);
      
      const user = await userService.updateProfile(
        req.user.id,
        updateDTO,
        res.locals.auditContext
      );
      
      return ApiResponse.success(
        res,
        SUCCESS.PROFILE_UPDATED,
        user
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (admin only)
   * GET /api/users/:id
   */
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(
        req.params.id,
        req.user.id,
        res.locals.auditContext
      );
      
      return ApiResponse.success(
        res,
        'Usuario obtenido exitosamente',
        user
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate account
   * DELETE /api/users/profile
   */
  async deactivateAccount(req, res, next) {
    try {
      const result = await userService.deactivateAccount(
        req.user.id,
        res.locals.auditContext
      );
      
      return ApiResponse.success(
        res,
        result.message
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
