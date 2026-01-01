// src/validators/common.validator.js
const { param, query } = require('express-validator');

class CommonValidator {
  /**
   * Valida que un parámetro sea un UUID válido
   * @param {string} paramName - Nombre del parámetro (default: 'id')
   * @returns {ValidationChain}
   */
  static validateUUID(paramName = 'id') {
    return param(paramName)
      .trim()
      .notEmpty().withMessage(`${paramName} es requerido`)
      .isUUID(4).withMessage(`${paramName} debe ser un UUID válido (v4)`);
  }

  /**
   * Valida múltiples parámetros UUID
   * @param {string[]} paramNames - Array de nombres de parámetros
   * @returns {ValidationChain[]}
   */
  static validateUUIDs(...paramNames) {
    return paramNames.map(name => this.validateUUID(name));
  }

  /**
   * Valida paginación (page y limit)
   * @returns {ValidationChain[]}
   */
  static validatePagination() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('page debe ser un número entero mayor o igual a 1')
        .toInt(),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('limit debe ser un número entero entre 1 y 100')
        .toInt()
    ];
  }

  /**
   * Valida ordenamiento (sortBy y sortOrder)
   * @param {string[]} allowedFields - Campos permitidos para ordenar
   * @returns {ValidationChain[]}
   */
  static validateSort(allowedFields = ['createdAt', 'updatedAt']) {
    return [
      query('sortBy')
        .optional()
        .isIn(allowedFields)
        .withMessage(`sortBy debe ser uno de: ${allowedFields.join(', ')}`),
      
      query('sortOrder')
        .optional()
        .isIn(['ASC', 'DESC', 'asc', 'desc'])
        .withMessage('sortOrder debe ser ASC o DESC')
        .toUpperCase()
    ];
  }

  /**
   * Valida filtro booleano
   * @param {string} fieldName - Nombre del campo
   * @returns {ValidationChain}
   */
  static validateBoolean(fieldName) {
    return query(fieldName)
      .optional()
      .isBoolean()
      .withMessage(`${fieldName} debe ser un booleano (true/false)`)
      .toBoolean();
  }

  /**
   * Valida búsqueda de texto
   * @param {string} fieldName - Nombre del campo (default: 'search')
   * @param {number} maxLength - Longitud máxima (default: 200)
   * @returns {ValidationChain}
   */
  static validateSearch(fieldName = 'search', maxLength = 200) {
    return query(fieldName)
      .optional()
      .trim()
      .isLength({ max: maxLength })
      .withMessage(`${fieldName} no puede exceder ${maxLength} caracteres`)
      .escape(); // Previene XSS
  }
}

module.exports = CommonValidator;
