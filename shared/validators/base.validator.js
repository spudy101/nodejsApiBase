'use strict';

/**
 * ============================================================
 * BASE VALIDATOR
 * ============================================================
 * Reglas de validación reutilizables para todo el módulo kyc.
 * Cada validator específico compone desde aquí — nunca duplicar reglas.
 *
 * Uso:
 *   const BaseValidator = require('../../shared/validators/base.validator');
 *
 *   class AuthValidator {
 *     static register() {
 *       return [
 *         ...BaseValidator.email(),
 *         ...BaseValidator.password(),
 *         ...BaseValidator.firstName(),
 *         ...BaseValidator.nationalId(),
 *       ];
 *     }
 *   }
 */

const { body, param, query, header } = require('express-validator');
const { REGEX }                       = require('../constants');

class BaseValidator {

  // ============================================================
  // IDENTITY
  // ============================================================

  static nationalId(field = 'nationalId') {
    return [
      body(field)
        .trim()
        .notEmpty().withMessage('El número de documento es requerido')
        .isLength({ min: 6, max: 20 }).withMessage('El número de documento debe tener entre 6 y 20 caracteres'),
    ];
  }

  static firstName(field = 'firstName') {
    return [
      body(field)
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/).withMessage('El nombre solo puede contener letras'),
    ];
  }

  static lastName(field = 'lastName') {
    return [
      body(field)
        .trim()
        .notEmpty().withMessage('El apellido es requerido')
        .isLength({ min: 2, max: 50 }).withMessage('El apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/).withMessage('El apellido solo puede contener letras'),
    ];
  }

  static optionalMiddleName(field = 'middleName') {
    return [
      body(field)
        .optional({ nullable: true })
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('El segundo nombre debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/).withMessage('El segundo nombre solo puede contener letras'),
    ];
  }

  static optionalSecondLastName(field = 'secondLastName') {
    return [
      body(field)
        .optional({ nullable: true })
        .trim()
        .isLength({ min: 2, max: 50 }).withMessage('El segundo apellido debe tener entre 2 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/).withMessage('El segundo apellido solo puede contener letras'),
    ];
  }

  static birthDate(field = 'birthDate') {
    return [
      body(field)
        .notEmpty().withMessage('La fecha de nacimiento es requerida')
        .isISO8601().withMessage('La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)')
        .toDate(),
    ];
  }

  static optionalBirthDate(field = 'birthDate') {
    return [
      body(field)
        .optional({ nullable: true })
        .isISO8601().withMessage('La fecha de nacimiento debe ser una fecha válida (YYYY-MM-DD)')
        .toDate(),
    ];
  }

  // ============================================================
  // CREDENTIALS
  // ============================================================

  static email(field = 'email') {
    return [
      body(field)
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .matches(REGEX.EMAIL).withMessage('Debe ser un email válido')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('El email no puede superar los 255 caracteres'),
    ];
  }

  static password(field = 'password') {
    return [
      body(field)
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(REGEX.PASSWORD)
        .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
    ];
  }

  static newPassword(field = 'newPassword') {
    return [
      body(field)
        .notEmpty().withMessage('La nueva contraseña es requerida')
        .isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres')
        .matches(REGEX.PASSWORD)
        .withMessage('La nueva contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
    ];
  }

  static totpCode(field = 'totpCode') {
    return [
      body(field)
        .trim()
        .notEmpty().withMessage('El código TOTP es requerido')
        .isLength({ min: 6, max: 6 }).withMessage('El código debe tener exactamente 6 dígitos')
        .isNumeric().withMessage('El código debe contener solo números'),
    ];
  }

  static resetToken(field = 'token') {
    return [
      body(field)
        .trim()
        .notEmpty().withMessage('El token es requerido')
        .isLength({ min: 64, max: 64 }).withMessage('El token debe tener 64 caracteres'),
    ];
  }

  // ============================================================
  // FOREIGN KEYS / UUIDs
  // ============================================================

  static uuidBody(field, label) {
    return [
      body(field)
        .notEmpty().withMessage(`${label} es requerido`)
        .isUUID().withMessage(`${label} debe ser un UUID válido`),
    ];
  }

  static optionalUuidBody(field, label) {
    return [
      body(field)
        .optional({ nullable: true })
        .isUUID().withMessage(`${label} debe ser un UUID válido`),
    ];
  }

  static uuidParam(field, label) {
    return [
      param(field)
        .notEmpty().withMessage(`${label} es requerido`)
        .isUUID().withMessage(`${label} debe ser un UUID válido`),
    ];
  }

  // ============================================================
  // CONTACT
  // ============================================================

  static phone(field, label = 'El teléfono') {
    return [
      body(field)
        .trim()
        .notEmpty().withMessage(`${label} es requerido`)
        .matches(/^\d{7,15}$/).withMessage(`${label} debe contener entre 7 y 15 dígitos`),
    ];
  }

  static optionalPhone(field, label = 'El teléfono') {
    return [
      body(field)
        .optional({ nullable: true })
        .trim()
        .matches(/^\d{7,15}$/).withMessage(`${label} debe contener entre 7 y 15 dígitos`),
    ];
  }

  // ============================================================
  // LOCATION
  // ============================================================

  static address(field = 'address') {
    return [
      body(field)
        .trim()
        .notEmpty().withMessage('La dirección es requerida')
        .isLength({ min: 5, max: 100 }).withMessage('La dirección debe tener entre 5 y 100 caracteres'),
    ];
  }

  static optionalPostalCode(field = 'postalCode') {
    return [
      body(field)
        .optional({ nullable: true })
        .trim()
        .isLength({ min: 3, max: 10 }).withMessage('El código postal debe tener entre 3 y 10 caracteres'),
    ];
  }

  // ============================================================
  // PAGINATION (query params)
  // ============================================================

  static pagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('La página debe ser un número entero mayor a 0')
        .toInt(),
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('El límite debe ser un número entre 1 y 100')
        .toInt(),
      query('sortBy')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('El campo de ordenamiento es inválido'),
      query('order')
        .optional()
        .trim()
        .isIn(['ASC', 'DESC', 'asc', 'desc']).withMessage('El orden debe ser ASC o DESC'),
    ];
  }

  /**
   * Búsqueda por texto en query params.
   * Separado de pagination() para usarlo solo donde aplique.
   */
  static _searchQuery() {
    return [
      query('search')
        .optional()
        .trim()
        .isString().withMessage('search debe ser un string')
        .isLength({ max: 100 }).withMessage('El término de búsqueda no puede superar 100 caracteres'),
    ];
  }

  // ============================================================
  // HEADERS
  // ============================================================

  static refreshTokenHeader() {
    return [
      header('x-refresh-token')
        .notEmpty().withMessage('Refresh token requerido en header X-Refresh-Token'),
    ];
  }
}

module.exports = BaseValidator;