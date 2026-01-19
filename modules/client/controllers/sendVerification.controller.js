'use strict';

const verificationService = require('../services/sendVerification.service');
const ApiResponse = require('../../../shared/utils/response.util');

class VerificationController {
  /**
   * Send verification code
   * POST /client/api/verification/send-verification
   */
  async sendVerification(req, res, next) {
    try {
      const result = await verificationService.sendVerificationCode(req.body);
      return ApiResponse.success(res, 'Código de verificación enviado', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify code
   * POST /client/api/verification/verify-code
   */
  async verifyCode(req, res, next) {
    try {
      const result = await verificationService.verifyCode(req.body);
      return ApiResponse.success(res, 'Código verificado exitosamente', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VerificationController();