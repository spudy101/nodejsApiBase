'use strict';

// ========== EJEMPLO DE USO EN CONTROLLER ==========
// Este archivo es solo de referencia para que adaptes tu controller

const kycMFAService = require('../services/kycMFA.service');
const ApiResponse = require('../utils/response.util');

class KycMFAController {
  /**
   * POST /api/kyc/mfa/setup
   * Headers: { Authorization: 'Bearer <accessToken>' }
   */
  async setupTOTP(req, res, next) {
    try {
      // Extraer accessToken del header
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      // Llamar service pasando body completo
      const result = await kycMFAService.setupTOTP(
        { accessToken },
        req.user
      );

      return ApiResponse.success(res, 'TOTP configurado correctamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/kyc/mfa/activate
   * Headers: { Authorization: 'Bearer <accessToken>' }
   * Body: { totpCode: '123456' }
   */
  async activateTOTP(req, res, next) {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      const result = await kycMFAService.verifyAndActivateTOTP(
        { ...req.body, accessToken },
        req.user,
        res.locals.auditContext
      );

      return ApiResponse.success(res, 'TOTP activado correctamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/kyc/mfa/verify
   * Headers: { Authorization: 'Bearer <accessToken>' }
   * Body: { totpCode: '123456' }
   */
  async verifyTOTP(req, res, next) {
    try {
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      const result = await kycMFAService.verifyTOTP(
        { ...req.body, accessToken },
        req.user
      );

      return ApiResponse.success(res, 'Código TOTP válido', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/kyc/mfa/deactivate
   * Headers: { Authorization: 'Bearer <accessToken>' }
   * Body: { password: 'userPassword123' }
   */
  async deactivateTOTP(req, res, next) {
    try {

      const result = await kycMFAService.deactivateTOTP(
        req.body,
        req.user,
        res.locals.auditContext
      );

      return ApiResponse.success(res, 'TOTP desactivado correctamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/kyc/mfa/validate-password
   * Headers: { Authorization: 'Bearer <accessToken>' }
   * Body: { password: 'userPassword123' }
   */
  async validatePassword(req, res, next) {
    try {

      const result = await kycMFAService.validatePassword(
        req.body,
        req.user
      );

      return ApiResponse.success(res, 'Contraseña válida', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KycMFAController();