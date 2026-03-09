'use strict';

const { body }      = require('express-validator');
const BaseValidator = require('../../../../shared/validators/base.validator');

class NotificationValidator {

  /**
   * GET /notifications, /notifications/personal, /notifications/global, /notifications/count
   * Reutiliza BaseValidator.pagination() — sin duplicar reglas
   */
  static paginationQuery() {
    return [
      ...BaseValidator.pagination(),
      // search es específico de notificaciones, no está en BaseValidator
      ...BaseValidator._searchQuery(),
    ];
  }

  /**
   * POST /notifications — crear notificación (endpoint para servicios externos)
   */
  static createNotification() {
    return [
      body('tipo_notificacion')
        .trim()
        .notEmpty().withMessage('El tipo de notificación es requerido')
        .isString().withMessage('El tipo de notificación debe ser un string'),

      ...BaseValidator.optionalUuidBody('user_id', 'El user_id'),

      body('metadata')
        .optional()
        .isObject().withMessage('metadata debe ser un objeto'),

      body('related_entity')
        .optional()
        .isObject().withMessage('related_entity debe ser un objeto'),

      body('related_entity.type')
        .optional()
        .trim()
        .isString().withMessage('related_entity.type debe ser un string'),

      ...BaseValidator.optionalUuidBody('related_entity.id', 'El related_entity.id'),
    ];
  }
}

module.exports = NotificationValidator;