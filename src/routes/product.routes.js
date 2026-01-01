// src/routes/product.routes.js
const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const productValidator = require('../validators/product.validator');
const AuthMiddleware = require('../middlewares/auth.middleware');
const RateLimitMiddleware = require('../middlewares/rateLimit.middleware');
const RequestLockMiddleware = require('../middlewares/requestLock.middleware');
const IdempotencyMiddleware = require('../middlewares/idempotency.middleware');
const ValidatorUtil = require('../utils/validators');
const ErrorMiddleware = require('../middlewares/error.middleware');

/**
 * @route   GET /api/products
 * @desc    List products with filters and pagination
 * @access  Public (with optional auth)
 */
router.get(
  '/',
  AuthMiddleware.optionalAuth,
  productValidator.listProducts(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(productController.listProducts.bind(productController))
);

/**
 * @route   GET /api/products/categories
 * @desc    Get all product categories
 * @access  Public
 */
router.get(
  '/categories',
  ErrorMiddleware.asyncHandler(productController.getCategories.bind(productController))
);

/**
 * @route   GET /api/products/my-products
 * @desc    Get user's products
 * @access  Private
 */
router.get(
  '/my-products',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(productController.getUserProducts.bind(productController))
);

/**
 * @route   GET /api/products/statistics
 * @desc    Get product statistics
 * @access  Private
 */
router.get(
  '/statistics',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(productController.getStatistics.bind(productController))
);

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public (with optional auth)
 */
router.get(
  '/:id',
  AuthMiddleware.optionalAuth,
  productValidator.getProductById(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(productController.getProduct.bind(productController))
);

/**
 * @route   POST /api/products
 * @desc    Create product
 * @access  Private
 */
router.post(
  '/',
  AuthMiddleware.verifyToken,
  RateLimitMiddleware.writeLimiter(),
  RequestLockMiddleware.preventDuplicates,
  IdempotencyMiddleware.handleIdempotency,
  productValidator.createProduct(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(productController.createProduct.bind(productController))
);

/**
 * @route   PUT /api/products/:id
 * @desc    Update product
 * @access  Private (Owner or Admin)
 */
router.put(
  '/:id',
  AuthMiddleware.verifyToken,
  RateLimitMiddleware.writeLimiter(),
  RequestLockMiddleware.preventDuplicates,
  productValidator.updateProduct(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(productController.updateProduct.bind(productController))
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Delete product (soft delete)
 * @access  Private (Owner or Admin)
 */
router.delete(
  '/:id',
  AuthMiddleware.verifyToken,
  RequestLockMiddleware.preventDuplicates,
  productValidator.deleteProduct(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(productController.deleteProduct.bind(productController))
);

module.exports = router;