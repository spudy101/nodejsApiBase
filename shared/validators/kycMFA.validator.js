'use strict';

const { body } = require('express-validator');

class KycMFAValidator {

  /**
   * Validation for verifying code
   * POST /kyc/activate-totp
   */
  static activateTOTP() {
    return [
      body('totpCode')
        .trim()
        .notEmpty().withMessage('El totpCode es requerido')
        .isLength({ min: 4, max: 8 }).withMessage('El código debe tener entre 4 y 8 caracteres')
    ];
  }

  /**
   * Validation for verifying code
   * POST /kyc/verify-totp
   */  
  static verifyTOTP() {
    return [
      body('totpCode')
        .trim()
        .notEmpty().withMessage('El totpCode es requerido')
        .isLength({ min: 4, max: 8 }).withMessage('El código debe tener entre 4 y 8 caracteres')
    ];
  }

  /**
   * Validation for password
   * POST /kyc/validate-password
   */
  static validatePassword() {
    return [
      
      body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~`+=])/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial')
    ];
  }

  /**
   * Validation for password
   * POST /kyc/deactivate-totp
   */
  static deactivateTOTP() {
    return [
      
      body('password')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~`+=])/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial')
    ];
  }  

}

module.exports = KycMFAValidator;