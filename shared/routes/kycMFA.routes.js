'use strict';

const express = require('express');
const router = express.Router();
const KycMFAController = require('../controllers/kycMFA.controller');
const kycMFAValidator = require('../validators/kycMFA.validator');
const AuthMiddleware = require('../middlewares/auth.middleware');
const SessionMiddleware = require('../middlewares/session.middleware');
const RequestLockMiddleware = require('../middlewares/requestLock.middleware');
const ValidatorUtil = require('../utils/validators.util');

/**
 * @route   POST /<admin>o<client>/api/kyc/mfa/setup-totp
 * @desc    Setup TOTP for user
 * @access  Protected
 */
router.post(
  '/setup-totp',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycMFAController.setupTOTP
);

/**
 * @route   POST /<admin>o<client>/api/kyc/mfa/activate-totp
 * @desc    Activate TOTP for user
 * @access  Protected
 */
router.post(
  '/activate-totp',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycMFAValidator.activateTOTP(),
  ValidatorUtil.handleValidationErrors,
  KycMFAController.activateTOTP
);

/**
 * @route   POST /<admin>o<client>/api/kyc/mfa/verify-totp
 * @desc    Verify TOTP code
 * @access  Protected
 */
router.post(
  '/verify-totp',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycMFAValidator.verifyTOTP(),
  ValidatorUtil.handleValidationErrors,
  KycMFAController.verifyTOTP
);

/**
 * @route   POST /<admin>o<client>/api/kyc/mfa/validate-password
 * @desc    Validate user password
 * @access  Protected
 */
router.post(
  '/validate-password',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycMFAValidator.validatePassword(),
  ValidatorUtil.handleValidationErrors,
  KycMFAController.validatePassword
);

/**
 * @route   POST /<admin>o<client>/api/kyc/mfa/deactivate-totp
 * @desc    Deactivate TOTP for user
 * @access  Protected
 */
router.post(
  '/deactivate-totp',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycMFAValidator.deactivateTOTP(),
  ValidatorUtil.handleValidationErrors,
  KycMFAController.deactivateTOTP
);

module.exports = router;