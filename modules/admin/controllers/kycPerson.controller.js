'use strict';

const kycPersonService = require('../services/kycPerson.service');
const ApiResponse = require('../../../shared/utils/response.util');
const { logger } = require('../../../shared/utils/logger.util');

class KycPersonController {
  /**
   * Lista usuarios con paginación
   * GET /api/kyc/person?page=1&limit=10&sortBy=username&order=ASC&search=juan&isActive=true&roleId=uuid
   */
  async list(req, res, next) {
    try {
      const { data, metadata } = await kycPersonService.list(req.query);
      return ApiResponse.success(res, 'Usuarios obtenidos exitosamente', data, 200, metadata);
    } catch (error) {
      logger.error('Error listing users', { error: error.message });
      next(error);
    }
  }

  /**
   * Crea un nuevo usuario
   * POST /api/kyc/person
   */
  async create(req, res, next) {
    try {
      const auditContext = {
        adminUserId: req.user.userId,
        ipAddress: res.locals.auditContext.ip,
        userAgent: res.locals.auditContext.userAgent,
      };

      const data = await kycPersonService.create(req.body, auditContext);
      return ApiResponse.success(res, 'Usuario creado exitosamente', data, 201);
    } catch (error) {
      logger.error('Error creating user', { error: error.message });
      next(error);
    }
  }

  /**
   * Activa un usuario desactivado
   * POST /admin/api/kyc/person/:userId/activate
   */
  async activate(req, res, next) {
    try {
      const { userId } = req.params;
      const auditContext = {
        adminUserId: req.user.userId,
        ipAddress: res.locals.auditContext.ip,
        userAgent: res.locals.auditContext.userAgent,
      };

      const data = await kycPersonService.activate(userId, auditContext);
      return ApiResponse.success(res, 'Usuario activado exitosamente', data);
    } catch (error) {
      logger.error('Error activating user', { error: error.message });
      next(error);
    }
  }

  /**
   * Desactiva un usuario activo
   * POST /admin/api/kyc/person/:userId/deactivate
   */
  async deactivate(req, res, next) {
    try {
      const { userId } = req.params;
      const auditContext = {
        adminUserId: req.user.userId,
        ipAddress: res.locals.auditContext.ip,
        userAgent: res.locals.auditContext.userAgent,
      };

      const data = await kycPersonService.deactivate(userId, auditContext);
      return ApiResponse.success(res, 'Usuario desactivado exitosamente', data);
    } catch (error) {
      logger.error('Error deactivating user', { error: error.message });
      next(error);
    }
  }

  /**
   * Resetea la contraseña de un usuario
   * POST /admin/api/kyc/person/:userId/reset-password
   */
  async resetPassword(req, res, next) {
    try {
      const { userId } = req.params;
      const auditContext = {
        adminUserId: req.user.userId,
        ipAddress: res.locals.auditContext.ip,
        userAgent: res.locals.auditContext.userAgent,
      };

      const data = await kycPersonService.resetPassword(userId, auditContext);
      return ApiResponse.success(res, 'Contraseña reseteada exitosamente', data);
    } catch (error) {
      logger.error('Error resetting password', { error: error.message });
      next(error);
    }
  }

  /**
   * Desactiva el MFA (TOTP) de un usuario
   * POST /admin/api/kyc/person/:userId/disable-mfa
   */
  async disableMFA(req, res, next) {
    try {
      const { userId } = req.params;
      const auditContext = {
        adminUserId: req.user.userId,
        ipAddress: res.locals.auditContext.ip,
        userAgent: res.locals.auditContext.userAgent,
      };

      const data = await kycPersonService.disableMFA(userId, auditContext);
      return ApiResponse.success(res, 'MFA desactivado exitosamente', data);
    } catch (error) {
      logger.error('Error disabling MFA', { error: error.message });
      next(error);
    }
  }

  /**
   * Cambia el email de un usuario
   * PATCH /admin/api/kyc/person/:userId/email
   */
  async changeEmail(req, res, next) {
    try {
      const { userId } = req.params;
      const { newEmail } = req.body;
      const auditContext = {
        adminUserId: req.user.userId,
        ipAddress: res.locals.auditContext.ip,
        userAgent: res.locals.auditContext.userAgent,
      };

      const data = await kycPersonService.changeEmail(userId, newEmail, auditContext);
      return ApiResponse.success(res, 'Email actualizado exitosamente', data);
    } catch (error) {
      logger.error('Error changing email', { error: error.message });
      next(error);
    }
  }

  /**
   * Cambia el national_id de un usuario
   * PATCH /admin/api/kyc/person/:userId/national-id
   */
  async changeNationalId(req, res, next) {
    try {
      const { userId } = req.params;
      const { newNationalId } = req.body;
      const auditContext = {
        adminUserId: req.user.userId,
        ipAddress: res.locals.auditContext.ip,
        userAgent: res.locals.auditContext.userAgent,
      };

      const data = await kycPersonService.changeNationalId(userId, newNationalId, auditContext);
      return ApiResponse.success(res, 'National ID actualizado exitosamente', data);
    } catch (error) {
      logger.error('Error changing national_id', { error: error.message });
      next(error);
    }
  }

  /**
   * Cambia el rol de un usuario
   * PATCH /admin/api/kyc/person/:userId/role
   */
  async changeRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { newRoleId } = req.body;
      const auditContext = {
        adminUserId: req.user.userId,
        ipAddress: res.locals.auditContext.ip,
        userAgent: res.locals.auditContext.userAgent,
      };

      const data = await kycPersonService.changeRole(userId, newRoleId, auditContext);
      return ApiResponse.success(res, 'Rol actualizado exitosamente', data);
    } catch (error) {
      logger.error('Error changing role', { error: error.message });
      next(error);
    }
  }

  /**
   * Elimina la cuenta de un usuario
   * DELETE /admin/api/kyc/person/:userId/delete-account
   */
  async deleteAccount(req, res, next) {
    try {
      const { userId } = req.params;
      const { currentPassword } = req.body;
      const auditContext = {
        adminUserId: req.user.userId,
        ipAddress: res.locals.auditContext.ip,
        userAgent: res.locals.auditContext.userAgent,
        passwordHash: req.user.passwordHash
      };

      await kycPersonService.deleteAccount(userId, currentPassword, auditContext);
      return ApiResponse.success(res, 'Cuenta eliminada exitosamente');
    } catch (error) {
      logger.error('Error deleting account', { error: error.message });
      next(error);
    }
  }
}

module.exports = new KycPersonController();