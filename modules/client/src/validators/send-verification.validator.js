'use strict';

const { body } = require('express-validator');
const BaseValidator = require('../../../../shared/validators/base.validator');

class SendVerificationValidator {

  /**
   * POST /verification/send
   * type: 'email' | 'phone'
   * contact: email o número de teléfono según tipo
   * phone_prefix_id: requerido solo si type === 'phone'
   */
  static sendVerificationCode() {
    return [
      body('type')
        .trim()
        .notEmpty().withMessage('El tipo es requerido')
        .isIn(['email', 'phone']).withMessage("El tipo debe ser 'email' o 'phone'"),

      // Email — requerido si type === 'email'
      body('contact')
        .trim()
        .notEmpty().withMessage('El contacto es requerido')
        .custom((value, { req }) => {
          if (req.body.type === 'email') {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error('El contacto debe ser un email válido');
            }
          } else if (req.body.type === 'phone') {
            const phoneRegex = /^\d{7,15}$/;
            if (!phoneRegex.test(value)) {
              throw new Error('El contacto debe ser un número de teléfono válido (7-15 dígitos)');
            }
          }
          return true;
        }),

      // phone_prefix_id — requerido solo si type === 'phone'
      body('phone_prefix_id')
        .if(body('type').equals('phone'))
        .notEmpty().withMessage('El prefijo telefónico es requerido para tipo phone')
        .isUUID().withMessage('El prefijo telefónico debe ser un UUID válido'),
    ];
  }

  /** POST /verification/verify */
  static verifyCode() {
    return [
      body('type')
        .trim()
        .notEmpty().withMessage('El tipo es requerido')
        .isIn(['email', 'phone']).withMessage("El tipo debe ser 'email' o 'phone'"),

      body('contact')
        .trim()
        .notEmpty().withMessage('El contacto es requerido'),

      ...BaseValidator.totpCode('code'), // 6 dígitos numéricos
    ];
  }
}

module.exports = SendVerificationValidator;
