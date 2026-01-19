'use strict';

const { body, query, param } = require('express-validator');

class KycPersonValidator {
  /**
   * Validación para query params de paginación con filtros específicos
   * GET /api/kyc/person
   */
  static listQuery() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('page debe ser un número entero mayor a 0')
        .toInt(),

      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('limit debe estar entre 1 y 100')
        .toInt(),

      query('sortBy')
        .optional()
        .isIn(['username', 'createdAt', 'updatedAt', 'is_active'])
        .withMessage('sortBy debe ser: username, createdAt, updatedAt o is_active'),

      query('order')
        .optional()
        .isIn(['ASC', 'DESC']).withMessage('order debe ser ASC o DESC')
        .toUpperCase(),

      query('search')
        .optional()
        .isString().withMessage('search debe ser un string')
        .trim(),

      query('isActive')
        .optional()
        .isBoolean().withMessage('isActive debe ser un booleano')
        .toBoolean(),

      query('roleId')
        .optional()
        .isUUID().withMessage('roleId debe ser un UUID válido')
    ];
  }

  /**
   * Validación para crear usuario
   * POST /api/kyc/person
   */
  static create() {
    return [
      body('nationalId')
        .notEmpty().withMessage('nationalId es requerido')
        .isString().withMessage('nationalId debe ser un string')
        .trim()
        .isLength({ min: 5, max: 50 }).withMessage('nationalId debe tener entre 5 y 50 caracteres'),

      body('email')
        .notEmpty().withMessage('email es requerido')
        .isEmail().withMessage('email debe ser un email válido')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('email debe tener máximo 255 caracteres'),

      body('firstName')
        .notEmpty().withMessage('firstName es requerido')
        .isString().withMessage('firstName debe ser un string')
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('firstName debe tener entre 2 y 100 caracteres'),

      body('lastName')
        .notEmpty().withMessage('lastName es requerido')
        .isString().withMessage('lastName debe ser un string')
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('lastName debe tener entre 2 y 100 caracteres'),

      body('roleId')
        .notEmpty().withMessage('roleId es requerido')
        .isUUID().withMessage('roleId debe ser un UUID válido'),

      body('birthDate')
        .optional()
        .isISO8601().withMessage('birthDate debe ser una fecha válida (ISO 8601)')
        .toDate(),

      body('genderId')
        .optional()
        .isUUID().withMessage('genderId debe ser un UUID válido'),

      body('countryId')
        .optional()
        .isUUID().withMessage('countryId debe ser un UUID válido')
    ];
  }

  /**
   * Validación para activar usuario
   * POST /admin/api/kyc/person/:userId/activate
   */
  static activate() {
    return [
      param('userId')
        .notEmpty().withMessage('userId es requerido')
        .isUUID().withMessage('userId debe ser un UUID válido')
    ];
  }

  /**
   * Validación para desactivar usuario
   * POST /admin/api/kyc/person/:userId/deactivate
   */
  static deactivate() {
    return [
      param('userId')
        .notEmpty().withMessage('userId es requerido')
        .isUUID().withMessage('userId debe ser un UUID válido')
    ];
  }

  /**
   * Validación para resetear contraseña
   * POST /admin/api/kyc/person/:userId/reset-password
   */
  static resetPassword() {
    return [
      param('userId')
        .notEmpty().withMessage('userId es requerido')
        .isUUID().withMessage('userId debe ser un UUID válido')
    ];
  }

  /**
   * Validación para desactivar MFA
   * POST /admin/api/kyc/person/:userId/disable-mfa
   */
  static disableMFA() {
    return [
      param('userId')
        .notEmpty().withMessage('userId es requerido')
        .isUUID().withMessage('userId debe ser un UUID válido')
    ];
  }

  /**
   * Validación para cambiar email
   * PATCH /admin/api/kyc/person/:userId/email
   */
  static changeEmail() {
    return [
      param('userId')
        .notEmpty().withMessage('userId es requerido')
        .isUUID().withMessage('userId debe ser un UUID válido'),

      body('newEmail')
        .notEmpty().withMessage('newEmail es requerido')
        .isEmail().withMessage('newEmail debe ser un email válido')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('newEmail debe tener máximo 255 caracteres')
    ];
  }

  /**
   * Validación para cambiar national_id
   * PATCH /admin/api/kyc/person/:userId/national-id
   */
  static changeNationalId() {
    return [
      param('userId')
        .notEmpty().withMessage('userId es requerido')
        .isUUID().withMessage('userId debe ser un UUID válido'),

      body('newNationalId')
        .notEmpty().withMessage('newNationalId es requerido')
        .isString().withMessage('newNationalId debe ser un string')
        .trim()
        .isLength({ min: 5, max: 50 }).withMessage('newNationalId debe tener entre 5 y 50 caracteres')
    ];
  }

  /**
   * Validación para cambiar rol
   * PATCH /admin/api/kyc/person/:userId/role
   */
  static changeRole() {
    return [
      param('userId')
        .notEmpty().withMessage('userId es requerido')
        .isUUID().withMessage('userId debe ser un UUID válido'),

      body('newRoleId')
        .notEmpty().withMessage('newRoleId es requerido')
        .isUUID().withMessage('newRoleId debe ser un UUID válido')
    ];
  }

  /**
   * Validación para eliminar cuenta de usuario
   * DELETE /admin/api/kyc/person/:userId/delete-account
   */
  static deleteAccount() {
    return [
      param('userId')
        .notEmpty().withMessage('userId es requerido')
        .isUUID().withMessage('userId debe ser un UUID válido'),

      body('currentPassword')
        .notEmpty().withMessage('currentPassword es requerido')
        .isString().withMessage('currentPassword debe ser un string')
        .trim()
    ];
  }
}

module.exports = KycPersonValidator;