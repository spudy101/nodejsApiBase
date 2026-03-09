'use strict';

const { body, param } = require('express-validator');
const BaseValidator   = require('../../../../shared/validators/base.validator');

class AuthLoginValidator {

  /** POST /auth/login */
  static login() {
    return [
      ...BaseValidator.nationalId(),
      ...BaseValidator.password(),
    ];
  }

  /** POST /auth/verify-mfa */
  static verifyMFA() {
    return [
      ...BaseValidator.nationalId(),
      ...BaseValidator.totpCode(),
      body('session')
        .trim()
        .notEmpty().withMessage('La sesión es requerida'),
    ];
  }

  /** POST /auth/refresh */
  static refreshToken() {
    return [
      ...BaseValidator.nationalId(),
      ...BaseValidator.refreshTokenHeader(),
    ];
  }

  /** PATCH /auth/devices/:deviceId */
  static renameDevice() {
    return [
      ...BaseValidator.uuidParam('deviceId', 'El ID del dispositivo'),
      body('deviceName')
        .trim()
        .notEmpty().withMessage('El nombre del dispositivo es requerido')
        .isLength({ min: 1, max: 100 }).withMessage('El nombre debe tener entre 1 y 100 caracteres'),
    ];
  }

  /** DELETE /auth/devices/:deviceId */
  static removeDevice() {
    return [
      ...BaseValidator.uuidParam('deviceId', 'El ID del dispositivo'),
    ];
  }
}

module.exports = AuthLoginValidator;