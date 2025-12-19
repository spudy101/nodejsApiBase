const { param, query } = require('express-validator');

/**
 * Validación de UUID en parámetros
 */
const uuidParamValidation = (paramName = 'id') => [
  param(paramName)
    .notEmpty().withMessage(`El ${paramName} es requerido`)
    .isUUID().withMessage(`El ${paramName} debe ser un UUID válido`)
];

/**
 * Validación de paginación
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
    .toInt()
];

/**
 * Validación de ordenamiento
 */
const sortValidation = (allowedFields = []) => [
  query('sortBy')
    .optional()
    .custom((value) => {
      if (allowedFields.length > 0 && !allowedFields.includes(value)) {
        throw new Error(`El campo de ordenamiento debe ser uno de: ${allowedFields.join(', ')}`);
      }
      return true;
    }),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('El orden debe ser ASC o DESC')
];

/**
 * Validación de búsqueda
 */
const searchValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El término de búsqueda debe tener entre 2 y 100 caracteres')
];

/**
 * Validación de rango de fechas
 */
const dateRangeValidation = [
  query('startDate')
    .optional()
    .isISO8601().withMessage('La fecha de inicio debe ser una fecha válida (ISO 8601)')
    .toDate(),

  query('endDate')
    .optional()
    .isISO8601().withMessage('La fecha de fin debe ser una fecha válida (ISO 8601)')
    .toDate()
    .custom((value, { req }) => {
      if (req.query.startDate && value < new Date(req.query.startDate)) {
        throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
      }
      return true;
    })
];

module.exports = {
  uuidParamValidation,
  paginationValidation,
  sortValidation,
  searchValidation,
  dateRangeValidation
};