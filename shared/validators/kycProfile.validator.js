'use strict';

const { body } = require('express-validator');

class KycProfileValidator {

  /**
   * Validation for updating profile
   * PUT /<admin>o<client>/api/kyc/profile
   */
  static updateProfile() {
    return [

      body().custom((value) => {
        const allowedFields = [
          'username',
          'avatar_id',
          'gender_id',
          'location'
        ];

        const hasAnyField = allowedFields.some(field => {
          if (field === 'location') {
            return value.location && Object.keys(value.location).length > 0;
          }
          return value[field] !== undefined;
        });

        if (!hasAnyField) {
          throw new Error('Debe enviar al menos un campo para actualizar el perfil');
        }

        return true;
      }),

      body('location')
        .optional()
        .custom((location) => {
          const requiredFields = [
            'country_id',
            'department_id',
            'city_id',
            'address',
          ];

          const missingFields = requiredFields.filter(
            field => !location[field]
          );

          if (missingFields.length > 0) {
            throw new Error(
              `Si envía location, los siguientes campos son obligatorios: ${missingFields.join(', ')}`
            );
          }

          return true;
        }),

      body('username')
        .optional()
        .isString().withMessage('El username debe ser una cadena de texto')
        .isLength({ min: 3, max: 30 }).withMessage('El username debe tener entre 3 y 30 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/).withMessage('El username solo puede contener letras, números y guiones bajos'),

      body('avatar_id')
        .optional()
        .isUUID().withMessage('El avatar_id debe ser un UUID válido'),

      body('gender_id')
        .optional()
        .isUUID().withMessage('El gender_id debe ser un UUID válido'),

      body('location.country_id')
        .optional()
        .isUUID().withMessage('El country_id debe ser un UUID válido'),

      body('location.department_id')
        .optional()
        .isUUID().withMessage('El department_id debe ser un UUID válido'),

      body('location.city_id')
        .optional()
        .isUUID().withMessage('El city_id debe ser un UUID válido'),

      body('location.address')
        .optional()
        .isString().withMessage('La dirección debe ser una cadena de texto')
        .isLength({ max: 255 }).withMessage('La dirección no puede exceder 255 caracteres'),

      body('location.postal_code')
        .optional()
        .isString().withMessage('El código postal debe ser una cadena de texto')
        .isLength({ max: 20 }).withMessage('El código postal no puede exceder 20 caracteres'),

      body('location.type')
        .optional()
        .isString().withMessage('Tipo de vivienda (EJ: Casa, Depto, etc.)')
        .isLength({ max: 40 }).withMessage('El tipo de vivienda no puede exceder 40 caracteres'),
    ];
  }

  /**
   * Validation for updating email
   * PUT /<admin>o<client>/api/kyc/profile/email
   */
  static updateEmail() {
    return [
      body('email')
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe proporcionar un email válido')
        .normalizeEmail()
        .isLength({ max: 100 }).withMessage('El email no puede exceder 100 caracteres'),

      body('currentPassword')
        .notEmpty().withMessage('La contraseña actual es requerida')
        .isString().withMessage('La contraseña debe ser una cadena de texto')
    ];
  }

  /**
   * Validation for updating phone
   * PUT /<admin>o<client>/api/kyc/profile/phone
   */
  static updatePhone() {
    return [
      body('phone')
        .notEmpty().withMessage('El teléfono es requerido')
        .isString().withMessage('El teléfono debe ser una cadena de texto')
        .matches(/^[0-9]+$/).withMessage('El teléfono solo puede contener números')
        .isLength({ min: 6, max: 15 }).withMessage('El teléfono debe tener entre 6 y 15 dígitos'),

      body('phone_prefix_id')
        .notEmpty().withMessage('El prefijo telefónico es requerido')
        .isUUID().withMessage('El phone_prefix_id debe ser un UUID válido'),

      body('phone_type')
        .notEmpty().withMessage('El tipo de teléfono es requerido')
        .isIn(['primary', 'secondary']).withMessage('El tipo de teléfono debe ser "primary" o "secondary"')
    ];
  }

  /**
   * Validation for updating password
   * PUT /<admin>o<client>/api/kyc/profile/password
   */
  static updatePassword() {
    return [
      body('currentPassword')
        .notEmpty().withMessage('La contraseña actual es requerida')
        .isString().withMessage('La contraseña debe ser una cadena de texto'),

      body('newPassword')
        .notEmpty().withMessage('La nueva contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\^$*.[\]{}()?\-"!@#%&/\\,><':;|_~`+=])/)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),

    ];
  }

  /**
   * Validation for updating national ID
   * PUT /<admin>o<client>/api/kyc/profile/nationalId
   */
  static updateNationalId() {
    return [
      body('newNationalId')
        .notEmpty().withMessage('El newNationalId es requerido')
        .isLength({ max: 20 }).withMessage('El newNationalId no puede exceder 20 caracteres'),

      body('currentPassword')
        .notEmpty().withMessage('La contraseña actual es requerida')
        .isString().withMessage('La contraseña debe ser una cadena de texto')
    ];
  }

  /**
   * Validation for deleting account
   * DELETE /<admin>o<client>/api/kyc/profile/delete-account
   */
  static deleteAccount() {
    return [
      body('currentPassword')
        .notEmpty().withMessage('La contraseña actual es requerida')
        .isString().withMessage('La contraseña debe ser una cadena de texto')
    ];
  }

}

module.exports = KycProfileValidator;