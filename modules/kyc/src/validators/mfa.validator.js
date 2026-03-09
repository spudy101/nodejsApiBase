'use strict';

const { body }      = require('express-validator');
const BaseValidator = require('../../../../shared/validators/base.validator');

class MFAValidator {

  /** POST /mfa/totp/setup — solo accessToken en body */
  static setupTOTP() {
    return [
      body('accessToken')
        .trim()
        .notEmpty().withMessage('El accessToken es requerido'),
    ];
  }

  /** POST /mfa/totp/verify-activate */
  static verifyAndActivateTOTP() {
    return [
      body('accessToken')
        .trim()
        .notEmpty().withMessage('El accessToken es requerido'),
      ...BaseValidator.totpCode('totpCode'),
    ];
  }

  /** POST /mfa/totp/verify */
  static verifyTOTP() {
    return [
      body('accessToken')
        .trim()
        .notEmpty().withMessage('El accessToken es requerido'),
      ...BaseValidator.totpCode('totpCode'),
    ];
  }

  /** DELETE /mfa/totp */
  static deactivateTOTP() {
    return [
      ...BaseValidator.password('password'),
    ];
  }

  /** POST /mfa/validate-password */
  static validatePassword() {
    return [
      ...BaseValidator.password('password'),
    ];
  }
}

module.exports = MFAValidator;
