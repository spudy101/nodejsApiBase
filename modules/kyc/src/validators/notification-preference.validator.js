'use strict';

const { body, param } = require('express-validator');
const BaseValidator   = require('../../../../shared/validators/base.validator');

class NotificationPreferenceValidator {

  /** GET /notification-preferences — sin body */
  static getPreferences() {
    return [];
  }

  /** PATCH /notification-preferences/global */
  static updateGlobalPreference() {
    return [
      body('allow_push')
        .optional({ nullable: true })
        .isBoolean().withMessage('allow_push debe ser un booleano'),

      body('allow_email')
        .optional({ nullable: true })
        .isBoolean().withMessage('allow_email debe ser un booleano'),

      body('quiet_hours_start')
        .optional({ nullable: true })
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('quiet_hours_start debe tener formato HH:MM'),

      body('quiet_hours_end')
        .optional({ nullable: true })
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('quiet_hours_end debe tener formato HH:MM'),
    ];
  }

  /** PATCH /notification-preferences/type */
  static updateTypePreference() {
    return [
      body('notification_type_code')
        .trim()
        .notEmpty().withMessage('El código de tipo de notificación es requerido')
        .isLength({ max: 100 }).withMessage('El código no puede superar los 100 caracteres'),

      body('allow_push')
        .optional({ nullable: true })
        .isBoolean().withMessage('allow_push debe ser un booleano'),

      body('allow_email')
        .optional({ nullable: true })
        .isBoolean().withMessage('allow_email debe ser un booleano'),
    ];
  }

  /** DELETE /notification-preferences/type/:notificationTypeCode */
  static deleteTypePreference() {
    return [
      param('notificationTypeCode')
        .trim()
        .notEmpty().withMessage('El código de tipo de notificación es requerido')
        .isLength({ max: 100 }).withMessage('El código no puede superar los 100 caracteres'),
    ];
  }

  /** PATCH /notification-preferences/batch */
  static batchUpdateTypePreferences() {
    return [
      body('preferences')
        .isArray({ min: 1 }).withMessage('Se requiere un array de preferencias con al menos un elemento'),

      body('preferences.*.notification_type_code')
        .trim()
        .notEmpty().withMessage('Cada preferencia debe tener un notification_type_code')
        .isLength({ max: 100 }).withMessage('El código no puede superar los 100 caracteres'),

      body('preferences.*.allow_push')
        .optional({ nullable: true })
        .isBoolean().withMessage('allow_push debe ser un booleano'),

      body('preferences.*.allow_email')
        .optional({ nullable: true })
        .isBoolean().withMessage('allow_email debe ser un booleano'),
    ];
  }
}

module.exports = NotificationPreferenceValidator;
