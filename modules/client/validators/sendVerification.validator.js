'use strict';

const { body } = require('express-validator');

class VerificationValidator {
  /**
   * Validation for sending verification code
   * POST /client/api/verification/send-verification
   */
  static sendVerification() {
    return [
      body('type')
        .trim()
        .notEmpty().withMessage('El tipo de verificación es requerido')
        .isIn(['email', 'phone']).withMessage('Tipo de verificación inválido'),

      body('contact')
        .trim()
        .notEmpty().withMessage('El contacto es requerido')
        .custom((value, { req }) => {
          const type = req.body.type;

          if (type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error('Debe ser un email válido');
            }
          }

          if (type === 'phone') {
            const phoneRegex = /^\+?[\d\s-]{8,15}$/;
            if (!phoneRegex.test(value)) {
              throw new Error('Debe ser un número de teléfono válido');
            }
          }

          return true;
        }),

      body('phone_prefix_id')
        .if(body('type').equals('phone'))
        .notEmpty().withMessage('phone_prefix_id es requerido cuando el tipo es phone')
        .isUUID().withMessage('phone_prefix_id debe ser un UUID válido'),
    ];
  }

  /**
   * Validation for verifying code
   * POST /client/api/verification/verify-code
   */
  static verifyCode() {
    return [
      body('type')
        .trim()
        .notEmpty().withMessage('El tipo de verificación es requerido')
        .isIn(['email', 'phone']).withMessage('Tipo de verificación inválido'),
      
      body('contact')
        .trim()
        .notEmpty().withMessage('El contacto es requerido'),
      
      body('code')
        .trim()
        .notEmpty().withMessage('El código es requerido')
        .isLength({ min: 4, max: 8 }).withMessage('El código debe tener entre 4 y 8 caracteres')
    ];
  }
}

module.exports = VerificationValidator;