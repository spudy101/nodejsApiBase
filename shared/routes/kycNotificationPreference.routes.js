'use strict';

const express = require('express');
const router = express.Router();
const kycNotificationPreferenceController = require('../controllers/kycNotificationPreference.controller');
const kycNotificationPreferenceValidator = require('../validators/kycNotificationPreference.validator');
const AuthMiddleware = require('../middlewares/auth.middleware');
const SessionMiddleware = require('../middlewares/session.middleware');
const RequestLockMiddleware = require('../middlewares/requestLock.middleware');
const ValidatorUtil = require('../utils/validators.util');

/**
 * @route   GET /<admin>o<client>/api/kyc/notification-preferences
 * @desc    Get all user notification preferences
 * @access  Protected
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycNotificationPreferenceController.getPreferences
);

/**
 * @route   PUT /<admin>o<client>/api/kyc/notification-preferences/global
 * @desc    Update global notification preference
 * @access  Protected
 */
router.put(
  '/global',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycNotificationPreferenceValidator.updateGlobalPreference(),
  ValidatorUtil.handleValidationErrors,
  kycNotificationPreferenceController.updateGlobalPreference
);

/**
 * @route   PUT /<admin>o<client>/api/kyc/notification-preferences/type
 * @desc    Create or update a specific notification type preference
 * @access  Protected
 */
router.put(
  '/type',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycNotificationPreferenceValidator.updateTypePreference(),
  ValidatorUtil.handleValidationErrors,
  kycNotificationPreferenceController.updateTypePreference
);

/**
 * @route   DELETE /<admin>o<client>/api/kyc/notification-preferences/type
 * @desc    Delete a specific notification type preference (reverts to global)
 * @access  Protected
 */
router.delete(
  '/type',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycNotificationPreferenceValidator.deleteTypePreference(),
  ValidatorUtil.handleValidationErrors,
  kycNotificationPreferenceController.deleteTypePreference
);

/**
 * @route   PUT /<admin>o<client>/api/kyc/notification-preferences/batch
 * @desc    Batch update multiple notification type preferences
 * @access  Protected
 */
router.put(
  '/batch',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycNotificationPreferenceValidator.batchUpdateTypePreferences(),
  ValidatorUtil.handleValidationErrors,
  kycNotificationPreferenceController.batchUpdateTypePreferences
);

module.exports = router;