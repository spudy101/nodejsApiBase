'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const AuthValidator = require('../validators/auth.validator');
const AuthMiddleware = require('../middlewares/auth.middleware');
const SessionMiddleware = require('../middlewares/session.middleware');
const RateLimitMiddleware = require('../middlewares/rateLimit.middleware');
const RequestLockMiddleware = require('../middlewares/requestLock.middleware');
const ValidatorUtil = require('../utils/validators.util');

/**
 * PUBLIC ROUTES (No authentication required)
 */

/**
 * @route   POST /<admin>o<client>/api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  RateLimitMiddleware.authLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  AuthValidator.login(),
  ValidatorUtil.handleValidationErrors,
  authController.login
);

/**
 * @route   POST /<admin>o<client>/api/auth/verify-mfa
 * @desc    Verify TOTP code and complete login
 * @access  Public
 */
router.post(
  '/verify-mfa',
  RateLimitMiddleware.authLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  AuthValidator.verifyMFA(),
  ValidatorUtil.handleValidationErrors,
  authController.verifyMFA
);

/**
 * @route   POST /<admin>o<client>/api/auth/refresh
 * @desc    Refresh access token
 * @access  Public (requires valid refresh token)
 */
router.post(
  '/refresh',
  RateLimitMiddleware.publicLimiter(),
  AuthValidator.refreshToken(),
  ValidatorUtil.handleValidationErrors,
  authController.refreshToken
);

/**
 * PROTECTED ROUTES (Authentication required)
 */

/**
 * @route   POST /<admin>o<client>/api/auth/logout
 * @desc    Logout user from current device
 * @access  Protected
 */
router.post(
  '/logout',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  authController.logout
);

/**
 * @route   POST /<admin>o<client>/api/auth/logout-all
 * @desc    Logout user from all devices
 * @access  Protected
 */
router.post(
  '/logout-all',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  authController.logoutAll
);

/**
 * @route   GET /<admin>o<client>/api/auth/sessions
 * @desc    Get all active sessions for current user
 * @access  Protected
 */
router.get(
  '/sessions',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  authController.getActiveSessions
);

/**
 * @route   DELETE /<admin>o<client>/api/auth/sessions/:deviceFingerprint
 * @desc    Logout from specific device
 * @access  Protected
 */
router.delete(
  '/sessions/:deviceFingerprint',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  authController.logoutDevice
);

module.exports = router;