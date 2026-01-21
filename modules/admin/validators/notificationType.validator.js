'use strict';

const { body, query, param } = require('express-validator');

class NotificationTypeValidator {
  /**
   * Validación para query params de paginación con filtros específicos
   * GET /admin/api/notification-types
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
        .isBoolean().withMessage('isActive debe ser un booleano')
        .toBoolean(),

      query('supportsPush')
        .optional()
        .isBoolean().withMessage('supportsPush debe ser un booleano')
        .toBoolean(),

      query('supportsEmail')
        .optional()
        .isBoolean().withMessage('supportsEmail debe ser un booleano')
        .toBoolean(),

      query('priority')
        .optional()
        .isIn(['normal', 'high']).withMessage('priority debe ser "normal" o "high"')
    ];
  }

  /**
   * Validación para actualizar tipo de notificación
   * PATCH /admin/api/notification-types/:notificationTypeId
   */
  static update() {
    return [
      param('notificationTypeId')
        .notEmpty().withMessage('notificationTypeId es requerido')
        .isUUID().withMessage('notificationTypeId debe ser un UUID válido'),

      body('name')
        .optional()
        .isString().withMessage('name debe ser un string')
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('name debe tener entre 2 y 100 caracteres'),

      body('description')
        .optional()
        .isString().withMessage('description debe ser un string')
        .trim()
        .isLength({ max: 500 }).withMessage('description debe tener máximo 500 caracteres'),

      body('supports_push')
        .optional()
        .isBoolean().withMessage('supports_push debe ser un booleano')
        .toBoolean(),

      body('supports_email')
        .optional()
        .isBoolean().withMessage('supports_email debe ser un booleano')
        .toBoolean(),

      body('priority')
        .optional()
        .isIn(['normal', 'high']).withMessage('priority debe ser "normal" o "high"'),

      body('title_template')
        .optional()
        .isString().withMessage('title_template debe ser un string')
        .trim()
        .isLength({ max: 255 }).withMessage('title_template debe tener máximo 255 caracteres'),

      body('body_template')
        .optional()
        .isString().withMessage('body_template debe ser un string')
        .trim(),

      body('email_subject_template')
        .if(body('supports_email').equals(true))
        .notEmpty().withMessage('email_subject_template es requerido cuando supports_email es true')
        .isString().withMessage('email_subject_template debe ser un string')
        .trim()
        .isLength({ min: 3, max: 255 }).withMessage('email_subject_template debe tener entre 3 y 255 caracteres'),

      body('email_body_template')
        .if(body('supports_email').equals(true))
        .notEmpty().withMessage('email_body_template es requerido cuando supports_email es true')
        .isString().withMessage('email_body_template debe ser un string')
        .trim()
        .custom((value) => {
          const hasHtmlTags = /<html[\s\S]*<\/html>/i.test(value) || 
                             /<body[\s\S]*<\/body>/i.test(value) ||
                             /<div[\s\S]*<\/div>/i.test(value) ||
                             /<p[\s\S]*<\/p>/i.test(value);
          
          if (!hasHtmlTags) {
            throw new Error('email_body_template debe contener formato HTML válido (html, body, div o p tags)');
          }
          return true;
        }),

      body('supports_email')
        .if((value, { req }) => req.body.email_subject_template || req.body.email_body_template)
        .custom((value, { req }) => {
          if (value !== true && (req.body.email_subject_template || req.body.email_body_template)) {
            throw new Error('supports_email debe ser true si se proporcionan templates de email');
          }
          return true;
        })
    ];
  }

  /**
   * Validación para crear notificación global usando NOTIFICACION_GENERAL
   * POST /admin/api/notification-types/global
   */
  static createGlobalNotification() {
    return [
      body('titulo')
        .notEmpty().withMessage('titulo es requerido')
        .isString().withMessage('titulo debe ser un string')
        .trim()
        .isLength({ min: 3, max: 255 }).withMessage('titulo debe tener entre 3 y 255 caracteres'),

      body('contenido')
        .notEmpty().withMessage('contenido es requerido')
        .isString().withMessage('contenido debe ser un string')
        .trim()
        .isLength({ min: 3 }).withMessage('contenido debe tener al menos 3 caracteres'),

      body('asunto')
        .notEmpty().withMessage('asunto es requerido')
        .isString().withMessage('asunto debe ser un string')
        .trim()
        .isLength({ min: 3, max: 255 }).withMessage('asunto debe tener entre 3 y 255 caracteres')
    ];
  }
}

module.exports = NotificationTypeValidator;