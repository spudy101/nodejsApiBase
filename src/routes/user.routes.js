// src/routes/user.routes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const userValidator = require('../validators/user.validator');
const AuthMiddleware = require('../middlewares/auth.middleware');
const RateLimitMiddleware = require('../middlewares/rateLimit.middleware');
const RequestLockMiddleware = require('../middlewares/requestLock.middleware');
const ValidatorUtil = require('../utils/validators');
const ErrorMiddleware = require('../middlewares/error.middleware');
const { USER_ROLES } = require('../constants');

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get(
  '/profile',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(userController.getProfile.bind(userController))
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  AuthMiddleware.verifyToken,
  RateLimitMiddleware.writeLimiter(),
  RequestLockMiddleware.preventDuplicates,
  userValidator.updateProfile(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(userController.updateProfile.bind(userController))
);

/**
 * @route   DELETE /api/users/account
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete(
  '/account',
  AuthMiddleware.verifyToken,
  RequestLockMiddleware.preventDuplicates,
  ErrorMiddleware.asyncHandler(userController.deactivateAccount.bind(userController))
);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID (Admin only)
 * @access  Private/Admin
 */
router.get(
  '/:id',
  AuthMiddleware.verifyToken,
  AuthMiddleware.authorize(USER_ROLES.ADMIN),
  userValidator.getUserById(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(userController.getUserById.bind(userController))
);

module.exports = router;