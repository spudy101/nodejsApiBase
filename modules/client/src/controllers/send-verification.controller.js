'use strict';

const VerificationService = require('../services/send-verification.service');
const ApiResponse         = require('../../../../shared/utils/app-response.util');
const { asyncHandler }    = require('../../../../shared/middlewares/error.middleware');

class SendVerificationController {

  /** POST /verification/send */
  sendVerificationCode = asyncHandler(async (req, res) => {
    const result = await VerificationService.sendVerificationCode(req.body);
    return ApiResponse.success(res, 'Código de verificación enviado exitosamente', result);
  });

  /** POST /verification/verify */
  verifyCode = asyncHandler(async (req, res) => {
    const result = await VerificationService.verifyCode(req.body);
    return ApiResponse.success(res, 'Código verificado exitosamente', result);
  });
}

module.exports = new SendVerificationController();
