const express = require('express');
const router = express.Router();
const { productController } = require('../controllers');
const { 
  authenticate,
  authorize,
  optionalAuth,
  requestLock,
  createLimiter
} = require('../middlewares');
const {
  createProductValidation,
  updateProductValidation,
  getProductByIdValidation,
  deleteProductValidation,
  listProductsValidation,
  updateStockValidation
} = require('../validators');
const { validateRequest } = require('../middlewares/validateRequest');

/**
 * @route   GET /api/v1/products/stats
 * @desc    Obtener estadísticas de productos
 * @access  Private (Admin)
 * @note    Esta ruta debe ir ANTES de /products/:id para evitar conflictos
 */
router.get(
  '/stats',
  authenticate,
  authorize('admin'),
  productController.getProductStats
);

/**
 * @route   GET /api/v1/products/category/:category
 * @desc    Obtener productos por categoría
 * @access  Public
 * @note    Esta ruta debe ir ANTES de /products/:id para evitar conflictos
 */
router.get(
  '/category/:category',
  productController.getProductsByCategory
);

/**
 * @route   GET /api/v1/products
 * @desc    Listar productos con filtros y paginación
 * @access  Public (con info adicional si está autenticado)
 */
router.get(
  '/',
  optionalAuth,
  listProductsValidation,
  validateRequest,
  productController.listProducts
);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Obtener producto por ID
 * @access  Public
 */
router.get(
  '/:id',
  getProductByIdValidation,
  validateRequest,
  productController.getProductById
);

/**
 * @route   POST /api/v1/products
 * @desc    Crear producto
 * @access  Private (Admin)
 */
router.post(
  '/',
  authenticate,
  authorize('admin'),
  createLimiter,
  requestLock(),
  createProductValidation,
  validateRequest,
  productController.createProduct
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Actualizar producto
 * @access  Private (Admin)
 */
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  requestLock(),
  updateProductValidation,
  validateRequest,
  productController.updateProduct
);

/**
 * @route   PATCH /api/v1/products/:id/stock
 * @desc    Actualizar stock del producto
 * @access  Private (Admin)
 */
router.patch(
  '/:id/stock',
  authenticate,
  authorize('admin'),
  requestLock({ timeout: 10000 }), // 10 segundos para operaciones de stock
  updateStockValidation,
  validateRequest,
  productController.updateStock
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Eliminar producto (soft delete)
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  requestLock(),
  deleteProductValidation,
  validateRequest,
  productController.deleteProduct
);

/**
 * @route   DELETE /api/v1/products/:id/permanent
 * @desc    Eliminar producto permanentemente
 * @access  Private (Admin)
 */
router.delete(
  '/:id/permanent',
  authenticate,
  authorize('admin'),
  deleteProductValidation,
  validateRequest,
  productController.permanentlyDeleteProduct
);

module.exports = router;