'use strict';

const { body, header, param } = require('express-validator');

class AuthValidator {

  /**
   * Validation for user login
   * POST /<admin>o<client>/api/auth/login
   */
  static login() {
    return [
      body('nationalId')
        .trim()
        .notEmpty().withMessage('El número de documento es requerido'),
      
      body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~`+=])/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial')
    ];
  }

  static verifyMFA() {
    return [
      body('nationalId')
        .trim()
        .notEmpty().withMessage('El número de documento es requerido'),
      
      body('totpCode')
        .trim()
        .notEmpty().withMessage('El código TOTP es requerido')
        .isLength({ min: 6, max: 6 }).withMessage('El código debe tener 6 dígitos')
        .isNumeric().withMessage('El código debe contener solo números'),
      
      body('session')
        .trim()
        .notEmpty().withMessage('La sesión es requerida'),
    ];
  }

  /**
   * Validate refresh token request
   */
  static refreshToken() {
    return [
      body('nationalId')
        .trim()
        .notEmpty().withMessage('El número de documento es requerido'),
      
      header('x-refresh-token')
        .notEmpty()
        .withMessage('Refresh token requerido en header X-Refresh-Token'),
    ];
  }

  /**
   * Validate logout from specific device
   * DELETE /<admin>o<client>/api/auth/sessions/:deviceFingerprint
   */
  static logoutDevice() {
    return [
      param('deviceFingerprint')
        .trim()
        .notEmpty().withMessage('El deviceFingerprint es requerido')
    ];
  }
}

module.exports = AuthValidator;