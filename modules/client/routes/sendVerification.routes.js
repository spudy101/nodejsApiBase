'use strict';

const express = require('express');
const router = express.Router();
const VerificationController = require('../controllers/sendVerification.controller');
const VerificationValidator = require('../validators/sendVerification.validator');
const RateLimitMiddleware = require('../../../shared/middlewares/rateLimit.middleware');
const RequestLockMiddleware = require('../../../shared/middlewares/requestLock.middleware');
const ValidatorUtil = require('../../../shared/utils/validators.util');

/**
 * @route   POST /client/api/verification/send-verification
 * @desc    Send verification code to email or phone
 * @access  Public
 */
router.post(
  '/send-verification',
  RateLimitMiddleware.publicLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  VerificationValidator.sendVerification(),
  ValidatorUtil.handleValidationErrors,
  VerificationController.sendVerification
);

/**
 * @route   POST /client/api/verification/verify-code
 * @desc    Verify code sent to email or phone
 * @access  Public
 */
router.post(
  '/verify-code',
  RateLimitMiddleware.publicLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  VerificationValidator.verifyCode(),
  ValidatorUtil.handleValidationErrors,
  VerificationController.verifyCode
);

module.exports = router;