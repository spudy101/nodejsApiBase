'use strict';

const express                = require('express');
const router                 = express.Router();
const AuthRegisterController = require('../controllers/auth-register.controller');
const AuthRegisterValidator  = require('../validators/auth-register.validator');
const RateLimitMiddleware    = require('../../../../shared/middlewares/rate-limit.middleware');
const RequestLockMiddleware  = require('../../../../shared/middlewares/request-lock.middleware');
const ValidatorUtil          = require('../../../../shared/utils/validators.util');

/**
 * POST /auth/register
 */
router.post(
  '/register',
  RateLimitMiddleware.authLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  AuthRegisterValidator.register(),
  ValidatorUtil.handleValidationErrors,
  AuthRegisterController.register
);

/**
 * POST /auth/reset-credentials/request
 */
router.post(
  '/reset-credentials/request',
  RateLimitMiddleware.authLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  AuthRegisterValidator.requestResetCredentials(),
  ValidatorUtil.handleValidationErrors,
  AuthRegisterController.requestResetCredentials
);

/**
 * POST /auth/reset-credentials/confirm
 */
router.post(
  '/reset-credentials/confirm',
  RateLimitMiddleware.authLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  AuthRegisterValidator.confirmResetCredentials(),
  ValidatorUtil.handleValidationErrors,
  AuthRegisterController.confirmResetCredentials
);

module.exports = router;