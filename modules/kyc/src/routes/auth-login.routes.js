'use strict';

const express              = require('express');
const router               = express.Router();
const AuthLoginController  = require('../controllers/auth-login.controller');
const AuthLoginValidator   = require('../validators/auth-login.validator');
const AuthMiddleware       = require('../../../../shared/middlewares/auth.middleware');
const RateLimitMiddleware  = require('../../../../shared/middlewares/rate-limit.middleware');
const RequestLockMiddleware = require('../../../../shared/middlewares/request-lock.middleware');
const ValidatorUtil        = require('../../../../shared/utils/validators.util');

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * POST /auth/login
 */
router.post(
  '/login',
  RateLimitMiddleware.authLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  AuthLoginValidator.login(),
  ValidatorUtil.handleValidationErrors,
  AuthLoginController.login
);

/**
 * POST /auth/verify-mfa
 */
router.post(
  '/verify-mfa',
  RateLimitMiddleware.authLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  AuthLoginValidator.verifyMFA(),
  ValidatorUtil.handleValidationErrors,
  AuthLoginController.verifyMFA
);

/**
 * POST /auth/refresh
 */
router.post(
  '/refresh',
  RateLimitMiddleware.publicLimiter(),
  AuthLoginValidator.refreshToken(),
  ValidatorUtil.handleValidationErrors,
  AuthLoginController.refreshToken
);

// ============================================================
// PROTECTED ROUTES
// ============================================================

/**
 * POST /auth/logout
 */
router.post(
  '/logout',
  AuthMiddleware.authenticate,
  RequestLockMiddleware.forAuthenticatedUsers(),
  AuthLoginController.logout
);

// ============================================================
// TRUSTED DEVICES (protected)
// ============================================================

/**
 * GET /auth/devices
 */
router.get(
  '/devices',
  AuthMiddleware.authenticate,
  RequestLockMiddleware.forAuthenticatedUsers(),
  AuthLoginController.getTrustedDevices
);

/**
 * PATCH /auth/devices/:deviceId
 */
router.patch(
  '/devices/:deviceId',
  AuthMiddleware.authenticate,
  RequestLockMiddleware.forAuthenticatedUsers(),
  AuthLoginValidator.renameDevice(),
  ValidatorUtil.handleValidationErrors,
  AuthLoginController.renameDevice
);

/**
 * DELETE /auth/devices/:deviceId
 */
router.delete(
  '/devices/:deviceId',
  AuthMiddleware.authenticate,
  RequestLockMiddleware.forAuthenticatedUsers(),
  AuthLoginValidator.removeDevice(),
  ValidatorUtil.handleValidationErrors,
  AuthLoginController.removeDevice
);

module.exports = router;