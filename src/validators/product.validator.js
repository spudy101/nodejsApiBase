// src/validators/product.validator.js
const { body, param, query } = require('express-validator');

class ProductValidator {
  static createProduct() {
    return [
      body('name')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),
      
      body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
      
      body('price')
        .notEmpty().withMessage('El precio es requerido')
        .isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0')
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
  }

  static updateProduct() {
    return [
      param('id')
        .trim()
        .notEmpty().withMessage('El ID es requerido')
        .isUUID().withMessage('El ID debe ser un UUID válido'),
      
      body('name')
        .optional()
        .trim()
        .isLength({ min: 3, max: 200 }).withMessage('El nombre debe tener entre 3 y 200 caracteres'),
      
      body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 }).withMessage('La descripción no puede exceder 1000 caracteres'),
      
      body('price')
        .optional()
        .isFloat({ min: 0 }).withMessage('El precio debe ser mayor o igual a 0')
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
  }

  static getProductById() {
    return [
      param('id')
        .trim()
        .notEmpty().withMessage('El ID es requerido')
        .isUUID().withMessage('El ID debe ser un UUID válido')
    ];
  }

  static deleteProduct() {
    return [
      param('id')
        .trim()
        .notEmpty().withMessage('El ID es requerido')
        .isUUID().withMessage('El ID debe ser un UUID válido')
    ];
  }

  static listProducts() {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('La página debe ser un número mayor a 0')
        .toInt(),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('El límite debe estar entre 1 y 100')
        .toInt(),
      
      query('search')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('La búsqueda no puede exceder 200 caracteres'),
      
      query('category')
        .optional()
        .trim()
        .isLength({ max: 100 }).withMessage('La categoría no puede exceder 100 caracteres'),
      
      query('isActive')
        .optional()
        .isBoolean().withMessage('isActive debe ser un valor booleano')
        .toBoolean(),
      
      query('sortBy')
        .optional()
        .isIn(['name', 'price', 'stock', 'createdAt', 'updatedAt']).withMessage('Campo de ordenamiento inválido'),
      
      query('sortOrder')
        .optional()
        .isIn(['ASC', 'DESC']).withMessage('El orden debe ser ASC o DESC')
        .toUpperCase()
    ];
  }
}

module.exports = ProductValidator;