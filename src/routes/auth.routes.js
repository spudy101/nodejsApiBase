// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const AuthMiddleware = require('../middlewares/auth.middleware');
const RateLimitMiddleware = require('../middlewares/rateLimit.middleware');
const IdempotencyMiddleware = require('../middlewares/idempotency.middleware');
const ValidatorUtil = require('../utils/validators');
const ErrorMiddleware = require('../middlewares/error.middleware');

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  RateLimitMiddleware.authLimiter(),
  IdempotencyMiddleware.handleIdempotency,
  authValidator.register(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(authController.register.bind(authController))
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
RateLimitMiddleware.authLimiter(),
  authValidator.login(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(authController.login.bind(authController))
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(authController.logout.bind(authController))
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  RateLimitMiddleware.authLimiter(),
  authValidator.refreshToken(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(authController.refreshToken.bind(authController))
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get(
  '/me',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(authController.me.bind(authController))
);

module.exports = router;