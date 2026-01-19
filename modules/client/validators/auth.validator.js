'use strict';

const { body } = require('express-validator');

class AuthValidator {
  /**
   * Validación para registro de usuario
   * POST /client/api/auth/register
   */
  static register() {
    return [
      body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
      
      body('password')
        .trim()
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
      
      body('firstName')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres'),
      
      body('lastName')
        .trim()
        .notEmpty().withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres'),
      
      body('nationalId')
        .trim()
        .notEmpty().withMessage('El número de documento es requerido')
        .isLength({ min: 6, max: 20 }).withMessage('El número de documento debe tener entre 6 y 20 caracteres'),
      
      body('genderId')
        .notEmpty().withMessage('El género es requerido')
        .isUUID().withMessage('El género debe ser un UUID válido'),

      body('countryId')
        .notEmpty().withMessage('El país es requerido')
        .isUUID().withMessage('El país debe ser un UUID válido')
    ];
  }

  /**
   * Validación para solicitar reset de credenciales
   * POST /client/api/auth/reset-credentials/request
   */
  static requestResetCredentials() {
    return [
      body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
      
      body('type')
        .trim()
        .notEmpty().withMessage('El tipo de reset es requerido')
        .isIn(['password', 'mfa']).withMessage('El tipo debe ser "password" o "mfa"')
    ];
  }

  /**
   * Validación para confirmar reset de credenciales
   * POST /client/api/auth/reset-credentials/confirm
   */
  static confirmResetCredentials() {
    return [
      body('token')
        .trim()
        .notEmpty().withMessage('El token es requerido')
        .isLength({ min: 64, max: 64 }).withMessage('El token debe tener 64 caracteres'),
      
      body('type')
        .trim()
        .notEmpty().withMessage('El tipo de reset es requerido')
        .isIn(['password', 'mfa']).withMessage('El tipo debe ser "password" o "mfa"'),
      
      body('newPassword')
        .if(body('type').equals('password'))
        .trim()
        .notEmpty().withMessage('La nueva contraseña es requerida para reset de tipo password')
        .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
    ];
  }
}

module.exports = AuthValidator;