'use strict';

const { query } = require('express-validator');

class MaintainersValidator {

  /**
   * Validación para query params de paginación
   * GET /<admin>o<client>/api/core-maintainers/*
   */
  static paginationQuery() {
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
        .isString().withMessage('sortBy debe ser un string')
        .trim(),

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
        .isBoolean().withMessage('isActive debe ser un boolean')
        .toBoolean(),

      query('countryId')
        .optional()
        .isUUID().withMessage('countryId debe ser un UUID válido'),

      query('themeId')
        .optional()
        .isUUID().withMessage('themeId debe ser un UUID válido'),

      query('departmentId')
        .optional()
        .isUUID().withMessage('departmentId debe ser un UUID válido'),

      query('supportsPush')
        .optional()
        .isBoolean().withMessage('supportsPush debe ser un boolean')
        .toBoolean(),

      query('supportsEmail')
        .optional()
        .isBoolean().withMessage('supportsEmail debe ser un boolean')
        .toBoolean(),

      query('priority')
        .optional()
        .isInt({ min: 1, max: 5 }).withMessage('priority debe ser un número entre 1 y 5')
        .toInt()
    ];
  }
}

module.exports = MaintainersValidator;