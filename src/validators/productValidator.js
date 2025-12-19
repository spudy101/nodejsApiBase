const { body, param, query } = require('express-validator');
const { Product } = require('../models');

/**
 * Validación para crear producto
 */
const createProductValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres')
    .custom(async (name) => {
      const existingProduct = await Product.findOne({ where: { name } });
      if (existingProduct) {
        throw new Error('Ya existe un producto con ese nombre');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),

  body('price')
    .notEmpty().withMessage('El precio es requerido')
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0')
    .toFloat(),

  body('stock')
    .notEmpty().withMessage('El stock es requerido')
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0')
    .toInt(),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La categoría no puede exceder 100 caracteres'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive debe ser un valor booleano')
    .toBoolean()
];

/**
 * Validación para actualizar producto
 */
const updateProductValidation = [
  param('id')
    .notEmpty().withMessage('El ID del producto es requerido')
    .isUUID().withMessage('El ID debe ser un UUID válido'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres')
    .custom(async (name, { req }) => {
      const existingProduct = await Product.findOne({ where: { name } });
      if (existingProduct && existingProduct.id !== req.params.id) {
        throw new Error('Ya existe otro producto con ese nombre');
      }
      return true;
    }),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),

  body('price')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio debe ser un número mayor o igual a 0')
    .toFloat(),

  body('stock')
    .optional()
    .isInt({ min: 0 }).withMessage('El stock debe ser un número entero mayor o igual a 0')
    .toInt(),

  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('La categoría no puede exceder 100 caracteres'),

  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive debe ser un valor booleano')
    .toBoolean()
];

/**
 * Validación para obtener producto por ID
 */
const getProductByIdValidation = [
  param('id')
    .notEmpty().withMessage('El ID del producto es requerido')
    .isUUID().withMessage('El ID debe ser un UUID válido')
];

/**
 * Validación para eliminar producto
 */
const deleteProductValidation = [
  param('id')
    .notEmpty().withMessage('El ID del producto es requerido')
    .isUUID().withMessage('El ID debe ser un UUID válido')
];

/**
 * Validación para listar productos (paginación y filtros)
 */
const listProductsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
    .toInt(),

  query('category')
    .optional()
    .trim(),

  query('isActive')
    .optional()
    .isBoolean().withMessage('isActive debe ser un valor booleano')
    .toBoolean(),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio mínimo debe ser mayor o igual a 0')
    .toFloat(),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 }).withMessage('El precio máximo debe ser mayor o igual a 0')
    .toFloat()
    .custom((value, { req }) => {
      if (req.query.minPrice && value < parseFloat(req.query.minPrice)) {
        throw new Error('El precio máximo debe ser mayor al precio mínimo');
      }
      return true;
    }),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2 }).withMessage('El término de búsqueda debe tener al menos 2 caracteres')
];

/**
 * Validación para actualizar stock
 */
const updateStockValidation = [
  param('id')
    .notEmpty().withMessage('El ID del producto es requerido')
    .isUUID().withMessage('El ID debe ser un UUID válido'),

  body('quantity')
    .notEmpty().withMessage('La cantidad es requerida')
    .isInt().withMessage('La cantidad debe ser un número entero')
    .toInt(),

  body('operation')
    .notEmpty().withMessage('La operación es requerida')
    .isIn(['add', 'subtract', 'set']).withMessage('La operación debe ser add, subtract o set')
];

module.exports = {
  createProductValidation,
  updateProductValidation,
  getProductByIdValidation,
  deleteProductValidation,
  listProductsValidation,
  updateStockValidation
};