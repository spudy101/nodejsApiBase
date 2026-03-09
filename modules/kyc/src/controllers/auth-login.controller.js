'use strict';

const AuthLoginService  = require('../services/auth-login.service');
const ApiResponse       = require('../../../../shared/utils/app-response.util');
const { asyncHandler }  = require('../../../../shared/middlewares/error.middleware');

class AuthLoginController {

  /** POST /auth/login */
  login = asyncHandler(async (req, res) => {
    const result = await AuthLoginService.login(req.body, {
      ip:              res.locals.auditContext?.ip,
      userAgent:       res.locals.auditContext?.userAgent,
      fingerprintHash: res.locals.fingerprintHash,
    });
    return ApiResponse.success(res, 'Inicio de sesión exitoso', result);
  });

  /** POST /auth/verify-mfa */
  verifyMFA = asyncHandler(async (req, res) => {
    const result = await AuthLoginService.verifyMFA(req.body, {
      ip:              res.locals.auditContext?.ip,
      userAgent:       res.locals.auditContext?.userAgent,
      fingerprintHash: res.locals.fingerprintHash,
    });
    return ApiResponse.success(res, 'Verificación MFA exitosa', result);
  });

  /** POST /auth/refresh */
  refreshToken = asyncHandler(async (req, res) => {
    const result = await AuthLoginService.refreshToken(
      req.headers['x-refresh-token'],
      req.body.nationalId
    );
    return ApiResponse.success(res, 'Token renovado exitosamente', result);
  });

  /** POST /auth/logout */
  logout = asyncHandler(async (req, res) => {
    await AuthLoginService.logout(req.user.userId, res.locals.fingerprintHash);
    return ApiResponse.success(res, 'Sesión cerrada exitosamente');
  });

  /** GET /auth/devices */
  getTrustedDevices = asyncHandler(async (req, res) => {
    const result = await AuthLoginService.getTrustedDevices(
      req.user.userId,
      res.locals.fingerprintHash
    );
    return ApiResponse.success(res, 'Dispositivos de confianza', result);
  });

  /** PATCH /auth/devices/:deviceId */
  renameDevice = asyncHandler(async (req, res) => {
    const result = await AuthLoginService.renameDevice(
      req.user.userId,
      req.params.deviceId,
      req.body.deviceName
    );
    return ApiResponse.success(res, 'Dispositivo renombrado', result);
  });

  /** DELETE /auth/devices/:deviceId */
  removeDevice = asyncHandler(async (req, res) => {
    await AuthLoginService.removeDevice(
      req.user.userId,
      req.params.deviceId,
      res.locals.fingerprintHash
    );
    return ApiResponse.noContent(res);
  });
}

module.exports = new AuthLoginController();