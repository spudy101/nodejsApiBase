'use strict';

const ProfileService = require('../../core/services/profile.service');
const { ApiResponse } = require('@abundbank/shared');

class ProfileController {
  /**
   * Get basic user profile
   * GET /<admin>o<client>/api/kyc/profile
   */
  async getProfile(req, res, next) {
    try {
      const result = await ProfileService.getProfile(req.user);
      return ApiResponse.success(res, 'Perfil básico obtenido exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get extended user profile
   * GET /<admin>o<client>/api/kyc/profile/extended
   */
  async getExtendedProfile(req, res, next) {
    try {
      const result = await ProfileService.getExtendedProfile(req.user);
      return ApiResponse.success(res, 'Perfil extendido obtenido exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user location
   * GET /<admin>o<client>/api/kyc/profile/location
   */
  async getLocation(req, res, next) {
    try {
      const result = await ProfileService.getLocation(req.user);
      return ApiResponse.success(res, 'Ubicación obtenida exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user contact information
   * GET /<admin>o<client>/api/kyc/profile/contact
   */
  async getContactInfo(req, res, next) {
    try {
      const result = await ProfileService.getContactInfo(req.user);
      return ApiResponse.success(res, 'Información de contacto obtenida exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user profile
   * PUT /<admin>o<client>/api/kyc/profile
   */
  async updateProfile(req, res, next) {
    try {
      const result = await ProfileService.updateProfile(req.body, req.user);
      return ApiResponse.success(res, 'Perfil actualizado exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user email
   * PUT /<admin>o<client>/api/kyc/profile/email
   */
  async updateEmail(req, res, next) {
    try {
      const result = await ProfileService.updateEmail(req.body, req.user, res.locals.auditContext);
      return ApiResponse.success(res, 'Email actualizado exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user phone
   * PUT /<admin>o<client>/api/kyc/profile/phone
   */
  async updatePhone(req, res, next) {
    try {
      const result = await ProfileService.updatePhone(req.body, req.user);
      return ApiResponse.success(res, 'Teléfono actualizado exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user password
   * PUT /<admin>o<client>/api/kyc/profile/password
   */
  async updatePassword(req, res, next) {
    try {
      const result = await ProfileService.updatePassword(req.body, req.user, res.locals.auditContext);
      return ApiResponse.success(res, 'Contraseña actualizada exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user national_id
   * PUT /<admin>o<client>/api/kyc/profile/nationalId
   */
  async updateNationalId(req, res, next) {
    try {
      const result = await ProfileService.updateNationalId(req.body, req.user, res.locals.auditContext);
      return ApiResponse.success(res, 'Identificación nacional actualizada exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user account
   * DELETE /<admin>o<client>/api/kyc/profile/delete-account
   */
  async deleteAccount(req, res, next) {
    try {
      await ProfileService.deleteAccount(req.body, req.user, res.locals.auditContext);
      return ApiResponse.success(res, 'Cuenta eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();