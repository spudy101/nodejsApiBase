'use strict';

const { body, query } = require('express-validator');

class KycZapSignValidator {
  /**
   * Validation for generating validation URL
   * POST /client/api/kyc/zapsign/generate-url
   */
  static generateUrl() {
    return [
      body('fullName')
        .notEmpty().withMessage('El nombre completo es requerido')
        .isString().withMessage('El nombre completo debe ser una cadena de texto')
        .isLength({ min: 3, max: 200 }).withMessage('El nombre completo debe tener entre 3 y 200 caracteres')
        .trim()
        .customSanitizer((value) => {
          // Normalizar espacios múltiples
          return value.replace(/\s+/g, ' ');
        })
        .custom((value) => {
          // Validar que tenga al menos nombre y apellido
          const parts = value.trim().split(' ');
          if (parts.length < 2) {
            throw new Error('Debes ingresar tu nombre completo (nombre y apellido como mínimo)');
          }
          return true;
        })
        .custom((value) => {
          // Validar que solo contenga letras, espacios y algunos caracteres especiales (tildes, ñ)
          const nameRegex = /^[a-záéíóúñA-ZÁÉÍÓÚÑ\s'-]+$/;
          if (!nameRegex.test(value)) {
            throw new Error('El nombre solo puede contener letras, espacios, guiones y apóstrofes');
          }
          return true;
        }),
      
      body('channel')
        .optional()
        .isString().withMessage('El canal debe ser una cadena de texto')
        .trim()
        .toLowerCase()
        .isIn(['web', 'mobile']).withMessage('El canal debe ser "web" o "mobile"')
        .customSanitizer((value) => {
          // Normalizar 'movil' a 'mobile'
          if (value === 'movil') {
            return 'mobile';
          }
          return value;
        }),
    ];
  }
}

module.exports = KycZapSignValidator;