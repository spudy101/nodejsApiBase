'use strict';

const mfaService       = require('../services/mfa.service');
const ApiResponse      = require('../../../../shared/utils/app-response.util');
const { asyncHandler } = require('../../../../shared/middlewares/error.middleware');

class MFAController {

  /** POST /mfa/totp/setup */
  setupTOTP = asyncHandler(async (req, res) => {
    const result = await mfaService.setupTOTP(req.body, req.user);
    return ApiResponse.success(res, 'TOTP configurado exitosamente', result);
  });

  /** POST /mfa/totp/verify-activate */
  verifyAndActivateTOTP = asyncHandler(async (req, res) => {
    const result = await mfaService.verifyAndActivateTOTP(
      req.body,
      req.user,
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
    return ApiResponse.success(res, 'TOTP activado exitosamente', result);
  });

  /** POST /mfa/totp/verify */
  verifyTOTP = asyncHandler(async (req, res) => {
    const result = await mfaService.verifyTOTP(req.body, req.user);
    return ApiResponse.success(res, 'TOTP verificado', result);
  });

  /** DELETE /mfa/totp */
  deactivateTOTP = asyncHandler(async (req, res) => {
    const result = await mfaService.deactivateTOTP(
      req.body,
      req.user,
      {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      }
    );
    return ApiResponse.success(res, 'TOTP desactivado exitosamente', result);
  });

  /** POST /mfa/validate-password */
  validatePassword = asyncHandler(async (req, res) => {
    const result = await mfaService.validatePassword(req.body, req.user);
    return ApiResponse.success(res, 'Contraseña validada', result);
  });
}

module.exports = new MFAController();
