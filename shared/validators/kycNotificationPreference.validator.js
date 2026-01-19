'use strict';

const { body } = require('express-validator');

class KycNotificationPreferenceValidator {

  /**
   * Validation for updating global preference
   * PUT /kyc-notification-preference/global
   */
  static updateGlobalPreference() {
    return [
      body('allow_push')
        .optional()
        .isBoolean().withMessage('allow_push debe ser un valor booleano'),
      
      body('allow_email')
        .optional()
        .isBoolean().withMessage('allow_email debe ser un valor booleano'),
      
      body('quiet_hours_start')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('quiet_hours_start debe tener formato HH:MM (00:00 - 23:59)'),
      
      body('quiet_hours_end')
        .optional()
        .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
        .withMessage('quiet_hours_end debe tener formato HH:MM (00:00 - 23:59)'),
      
      // Validación personalizada: al menos un campo debe estar presente
      body().custom((value, { req }) => {
        const allowedFields = ['allow_push', 'allow_email', 'quiet_hours_start', 'quiet_hours_end'];
        const hasAtLeastOne = allowedFields.some(field => req.body[field] !== undefined);
        
        if (!hasAtLeastOne) {
          throw new Error('Debe proporcionar al menos un campo para actualizar');
        }
        
        return true;
      })
    ];
  }

  /**
   * Validation for updating type preference
   * PUT /kyc-notification-preference/type
   */
  static updateTypePreference() {
    return [
      body('notification_type_code')
        .notEmpty().withMessage('El código de tipo de notificación es requerido')
        .isString().withMessage('El código de tipo debe ser una cadena de texto')
        .isLength({ max: 50 }).withMessage('El código de tipo no puede exceder 50 caracteres'),
      
      body('allow_push')
        .optional()
        .isBoolean().withMessage('allow_push debe ser un valor booleano'),
      
      body('allow_email')
        .optional()
        .isBoolean().withMessage('allow_email debe ser un valor booleano')
    ];
  }

  /**
   * Validation for deleting type preference
   * DELETE /kyc-notification-preference/type
   */
  static deleteTypePreference() {
    return [
      body('notification_type_code')
        .notEmpty().withMessage('El código de tipo de notificación es requerido')
        .isString().withMessage('El código de tipo debe ser una cadena de texto')
        .isLength({ max: 50 }).withMessage('El código de tipo no puede exceder 50 caracteres')
    ];
  }

  /**
   * Validation for batch updating type preferences
   * PUT /kyc-notification-preference/batch
   */
  static batchUpdateTypePreferences() {
    return [
      body('preferences')
        .notEmpty().withMessage('El array de preferencias es requerido')
        .isArray({ min: 1 }).withMessage('preferences debe ser un array con al menos un elemento'),
      
      body('preferences.*.notification_type_code')
        .notEmpty().withMessage('Cada preferencia debe tener un notification_type_code')
        .isString().withMessage('El código de tipo debe ser una cadena de texto')
        .isLength({ max: 50 }).withMessage('El código de tipo no puede exceder 50 caracteres'),
      
      body('preferences.*.allow_push')
        .optional()
        .isBoolean().withMessage('allow_push debe ser un valor booleano'),
      
      body('preferences.*.allow_email')
        .optional()
        .isBoolean().withMessage('allow_email debe ser un valor booleano')
    ];
  }
}

module.exports = KycNotificationPreferenceValidator;