'use strict';

const { body, query } = require('express-validator');

class NotificationValidator {

  /**
   * Validación para crear notificación
   * POST /notifications
   */
  static createNotification() {
    return [
      body('tipo_notificacion')
        .notEmpty().withMessage('El tipo de notificación es requerido')
        .isString().withMessage('El tipo de notificación debe ser un string')
        .trim(),

      body('user_id')
        .optional()
        .isUUID().withMessage('El user_id debe ser un UUID válido'),

      body('metadata')
        .optional()
        .isObject().withMessage('metadata debe ser un objeto'),

      body('related_entity')
        .optional()
        .isObject().withMessage('related_entity debe ser un objeto'),

      body('related_entity.type')
        .optional()
        .isString().withMessage('related_entity.type debe ser un string')
        .trim(),

      body('related_entity.id')
        .optional()
        .isUUID().withMessage('related_entity.id debe ser un UUID válido')
    ];
  }

  /**
   * Validación para query params de paginación
   * GET /notifications
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
        .trim()
    ];
  }
}

module.exports = NotificationValidator;