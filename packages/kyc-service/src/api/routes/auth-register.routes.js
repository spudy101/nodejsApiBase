'use strict';

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/auth-register.controller');
const AuthValidator = require('../validators/auth-register.validator');
const { AuthMiddleware } = require('@abundbank/shared');
const { SessionMiddleware } = require('@abundbank/shared');
const { RateLimitMiddleware } = require('@abundbank/shared');
const { RequestLockMiddleware } = require('@abundbank/shared');
const { ValidatorUtil } = require('@abundbank/shared');

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
  AuthController.register
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
  AuthController.requestResetCredentials
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
  AuthController.confirmResetCredentials
);

module.exports = router;