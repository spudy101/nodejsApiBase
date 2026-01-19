'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const AuthValidator = require('../validators/auth.validator');
const RateLimitMiddleware = require('../../../shared/middlewares/rateLimit.middleware');
const RequestLockMiddleware = require('../../../shared/middlewares/requestLock.middleware');
const ValidatorUtil = require('../../../shared/utils/validators.util');

/**
 * @route   POST /client/api/auth/register
 * @desc    Registrar nuevo usuario
 * @access  Public
 */
router.post(
  '/register',
  RateLimitMiddleware.authLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  AuthValidator.register(),
  ValidatorUtil.handleValidationErrors,
  authController.register
);

/**
 * @route   POST /client/api/auth/reset-credentials/request
 * @desc    Solicitar reset de credenciales (password o MFA)
 * @access  Public
 */
router.post(
  '/reset-credentials/request',
  RateLimitMiddleware.authLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  AuthValidator.requestResetCredentials(),
  ValidatorUtil.handleValidationErrors,
  authController.requestResetCredentials
);

/**
 * @route   POST /client/api/auth/reset-credentials/confirm
 * @desc    Confirmar reset de credenciales con token
 * @access  Public
 */
router.post(
  '/reset-credentials/confirm',
  RateLimitMiddleware.authLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  AuthValidator.confirmResetCredentials(),
  ValidatorUtil.handleValidationErrors,
  authController.confirmResetCredentials
);

module.exports = router;