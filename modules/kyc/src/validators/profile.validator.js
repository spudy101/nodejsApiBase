'use strict';

const { body }      = require('express-validator');
const BaseValidator = require('../../../../shared/validators/base.validator');

class ProfileValidator {

  /** GET /profile & GET /profile/full — sin body */
  static getProfile() {
    return [];
  }

  /** PATCH /profile — todos opcionales, al menos uno requerido se valida en el service */
  static updateProfile() {
    return [
      body('username')
        .optional({ nullable: true })
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage('El username debe tener entre 3 y 30 caracteres')
        .matches(/^[a-zA-Z0-9_.]+$/).withMessage('El username solo puede contener letras, números, puntos y guiones bajos'),

      ...BaseValidator.optionalUuidBody('avatarId', 'El ID del avatar'),
      ...BaseValidator.optionalUuidBody('genderId', 'El ID del género'),

      // Anidado: location
      body('location').optional({ nullable: true }).isObject().withMessage('La ubicación debe ser un objeto'),
      ...BaseValidator.optionalUuidBody('location.countryId',    'El ID del país'),
      ...BaseValidator.optionalUuidBody('location.departmentId', 'El ID del departamento'),
      ...BaseValidator.optionalUuidBody('location.cityId',       'El ID de la ciudad'),
      ...BaseValidator.address('location.address').map(r => r.optional({ nullable: true })),
      ...BaseValidator.optionalPostalCode('location.postalCode'),
    ];
  }

  /** PUT /profile/email */
  static updateEmail() {
    return [
      ...BaseValidator.email('email'),
      ...BaseValidator.password('currentPassword'),
    ];
  }

  /** PUT /profile/phone */
  static updatePhone() {
    return [
      body('phoneType')
        .trim()
        .notEmpty().withMessage('El tipo de teléfono es requerido')
        .isIn(['primary', 'secondary']).withMessage('El tipo de teléfono debe ser primary o secondary'),

      ...BaseValidator.phone('newPhone', 'El nuevo teléfono'),
      ...BaseValidator.uuidBody('prefixId', 'El prefijo telefónico'),
    ];
  }

  /** PUT /profile/password */
  static updatePassword() {
    return [
      ...BaseValidator.password('currentPassword'),
      ...BaseValidator.newPassword('newPassword'),
      body('newPassword')
        .custom((value, { req }) => {
          if (value === req.body.currentPassword) {
            throw new Error('La nueva contraseña no puede ser igual a la actual');
          }
          return true;
        }),
    ];
  }

  /** PUT /profile/national-id */
  static updateNationalId() {
    return [
      ...BaseValidator.nationalId('newNationalId'),
      ...BaseValidator.password('currentPassword'),
    ];
  }

  /** DELETE /profile */
  static deleteAccount() {
    return [
      ...BaseValidator.password('currentPassword'),
    ];
  }
}

module.exports = ProfileValidator;