'use strict';

const express = require('express');
const router = express.Router();
const kycProfileController = require('../controllers/kycProfile.controller');
const kycProfileValidator = require('../validators/kycProfile.validator');
const AuthMiddleware = require('../middlewares/auth.middleware');
const SessionMiddleware = require('../middlewares/session.middleware');
const RequestLockMiddleware = require('../middlewares/requestLock.middleware');
const ValidatorUtil = require('../utils/validators.util');


/**
 * @route   GET /kyc-profile/profile
 * @desc    Get basic user profile
 * @access  Protected
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileController.getProfile
);

/**
 * @route   GET /kyc-profile/profile/extended
 * @desc    Get extended user profile (includes location, social networks, preferences)
 * @access  Protected
 */
router.get(
  '/extended',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileController.getExtendedProfile
);

/**
 * @route   GET /kyc-profile/location
 * @desc    Get user location information
 * @access  Protected
 */
router.get(
  '/location',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileController.getLocation
);

/**
 * @route   GET /kyc-profile/contact
 * @desc    Get user contact information
 * @access  Protected
 */
router.get(
  '/contact',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileController.getContactInfo
);

/**
 * @route   PUT /kyc-profile/profile
 * @desc    Update user profile (username, avatar, location)
 * @access  Protected
 */
router.put(
  '/',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileValidator.updateProfile(),
  ValidatorUtil.handleValidationErrors,
  kycProfileController.updateProfile
);

/**
 * @route   PUT /kyc-profile/email
 * @desc    Update user email (requires verification)
 * @access  Protected
 */
router.put(
  '/email',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileValidator.updateEmail(),
  ValidatorUtil.handleValidationErrors,
  kycProfileController.updateEmail
);

/**
 * @route   PUT /kyc-profile/phone
 * @desc    Update user phone (requires verification)
 * @access  Protected
 */
router.put(
  '/phone',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileValidator.updatePhone(),
  ValidatorUtil.handleValidationErrors,
  kycProfileController.updatePhone
);

/**
 * @route   PUT /kyc-profile/password
 * @desc    Update user password
 * @access  Protected
 */
router.put(
  '/password',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileValidator.updatePassword(),
  ValidatorUtil.handleValidationErrors,
  kycProfileController.updatePassword
);

/**
 * @route   PUT /kyc-profile/nationalId
 * @desc    Update user nationalId
 * @access  Protected
 */
router.put(
  '/nationalId',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileValidator.updateNationalId(),
  ValidatorUtil.handleValidationErrors,
  kycProfileController.updateNationalId
);

router.delete(
  '/delete-account',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileValidator.deleteAccount(),
  ValidatorUtil.handleValidationErrors,
  kycProfileController.deleteAccount
);

module.exports = router;