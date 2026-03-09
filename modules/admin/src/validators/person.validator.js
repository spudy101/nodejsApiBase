'use strict';

const { body }      = require('express-validator');
const BaseValidator = require('../../../../shared/validators/base.validator');

class PersonValidator {

  /** GET /persons — sin body */
  static list() {
    return [
      ...BaseValidator.pagination(),
      ...BaseValidator._searchQuery(),
    ];
  }

  /** GET /persons/:userId — sin body */
  static getById() {
    return [
      ...BaseValidator.uuidParam('userId', 'El ID del usuario'),
    ];
  }

  /** POST /persons */
  static create() {
    return [
      ...BaseValidator.firstName('firstName'),
      ...BaseValidator.lastName('lastName'),
      ...BaseValidator.optionalMiddleName('middleName'),
      ...BaseValidator.optionalSecondLastName('secondLastName'),
      ...BaseValidator.nationalId('nationalId'),
      ...BaseValidator.email('email'),
      ...BaseValidator.uuidBody('roleId', 'El ID del rol'),
      ...BaseValidator.optionalBirthDate('birthDate'),
      ...BaseValidator.optionalUuidBody('genderId',   'El ID del género'),
      ...BaseValidator.optionalUuidBody('countryId',  'El ID del país'),
    ];
  }

  /** PATCH /persons/:userId/activate — sin body */
  static activate() {
    return [
      ...BaseValidator.uuidParam('userId', 'El ID del usuario'),
    ];
  }

  /** PATCH /persons/:userId/deactivate — sin body */
  static deactivate() {
    return [
      ...BaseValidator.uuidParam('userId', 'El ID del usuario'),
    ];
  }

  /** POST /persons/:userId/reset-password — sin body */
  static resetPassword() {
    return [
      ...BaseValidator.uuidParam('userId', 'El ID del usuario'),
    ];
  }

  /** PUT /persons/:userId/email */
  static changeEmail() {
    return [
      ...BaseValidator.uuidParam('userId', 'El ID del usuario'),
      ...BaseValidator.email('newEmail'),
    ];
  }

  /** PUT /persons/:userId/national-id */
  static changeNationalId() {
    return [
      ...BaseValidator.uuidParam('userId', 'El ID del usuario'),
      ...BaseValidator.nationalId('newNationalId'),
    ];
  }

  /** PATCH /persons/:userId/disable-mfa — sin body */
  static disableMFA() {
    return [
      ...BaseValidator.uuidParam('userId', 'El ID del usuario'),
    ];
  }

  /** PUT /persons/:userId/role */
  static changeRole() {
    return [
      ...BaseValidator.uuidParam('userId', 'El ID del usuario'),
      ...BaseValidator.uuidBody('newRoleId', 'El ID del nuevo rol'),
    ];
  }

  /** DELETE /persons/:userId */
  static deleteAccount() {
    return [
      ...BaseValidator.uuidParam('userId', 'El ID del usuario'),
      ...BaseValidator.password('currentPassword'),
    ];
  }
}

module.exports = PersonValidator;
