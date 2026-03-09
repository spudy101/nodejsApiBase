'use strict';

const AuthRegisterService = require('../services/auth-register.service');
const ApiResponse         = require('../../../../shared/utils/app-response.util');
const { asyncHandler }    = require('../../../../shared/middlewares/error.middleware');

class AuthRegisterController {

  /** POST /auth/register */
  register = asyncHandler(async (req, res) => {
    const result = await AuthRegisterService.register(req.body);
    return ApiResponse.created(res, 'Usuario registrado exitosamente', result);
  });

  /** POST /auth/reset-credentials/request */
  requestResetCredentials = asyncHandler(async (req, res) => {
    await AuthRegisterService.requestResetCredentials(req.body);
    // Respuesta genérica — no revelamos si el email existe
    return ApiResponse.success(res, 'Si el email existe en nuestro sistema, recibirás un correo con instrucciones');
  });

  /** POST /auth/reset-credentials/confirm */
  confirmResetCredentials = asyncHandler(async (req, res) => {
    await AuthRegisterService.confirmResetCredentials(req.body);
    const message = req.body.type === 'password'
      ? 'Contraseña actualizada exitosamente'
      : 'MFA desactivado exitosamente';
    return ApiResponse.success(res, message);
  });
}

module.exports = new AuthRegisterController();