'use strict';

/**
 * Auth Validator — módulo register (client)
 * Cubre: register, requestResetCredentials, confirmResetCredentials
 */

const { body } = require('express-validator');
const BaseValidator = require('../../../../shared/validators/base.validator');

class AuthRegisterValidator {
  static register() {
    return [
      ...BaseValidator.email(),
      ...BaseValidator.password(),
      ...BaseValidator.firstName(),
      ...BaseValidator.lastName(),
      ...BaseValidator.optionalMiddleName(),
      ...BaseValidator.optionalSecondLastName(),
      ...BaseValidator.nationalId(),
      ...BaseValidator.uuidBody('genderId', 'El género'),
      ...BaseValidator.uuidBody('countryId', 'El país'),
    ];
  }

  static requestResetCredentials() {
    return [
      ...BaseValidator.email(),
      body('type')
        .trim()
        .notEmpty().withMessage('El tipo de reset es requerido')
        .isIn(['password', 'mfa']).withMessage('El tipo debe ser "password" o "mfa"'),
    ];
  }

  static confirmResetCredentials() {
    return [
      ...BaseValidator.resetToken(),
      body('type')
        .trim()
        .notEmpty().withMessage('El tipo de reset es requerido')
        .isIn(['password', 'mfa']).withMessage('El tipo debe ser "password" o "mfa"'),
      // newPassword solo requerido cuando type === 'password'
      body('newPassword')
        .if(body('type').equals('password'))
        .notEmpty().withMessage('La nueva contraseña es requerida para reset de tipo password')
        .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~`+=])/)
        .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
    ];
  }
}

module.exports = AuthRegisterValidator;