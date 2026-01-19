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
 * @route   GET /<admin>o<client>/api/kyc/profile
 * @desc    Get basic user profile
 * @access  Protected (Admin & Client)
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileController.getProfile
);

/**
 * @route   GET /<admin>o<client>/api/kyc/profile/extended
 * @desc    Get extended user profile (includes location, social networks, preferences)
 * @access  Protected (Admin & Client)
 */
router.get(
  '/extended',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileController.getExtendedProfile
);

/**
 * @route   GET /<admin>o<client>/api/kyc/profile/location
 * @desc    Get user location information
 * @access  Protected (Admin & Client)
 */
router.get(
  '/location',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileController.getLocation
);

/**
 * @route   GET /<admin>o<client>/api/kyc/profile/contact
 * @desc    Get user contact information
 * @access  Protected (Admin & Client)
 */
router.get(
  '/contact',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycProfileController.getContactInfo
);

/**
 * @route   PUT /<admin>o<client>/api/kyc/profile
 * @desc    Update user profile (username, avatar, location)
 * @access  Protected (Admin & Client)
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
 * @route   PUT /<admin>o<client>/api/kyc/profile/email
 * @desc    Update user email (requires verification)
 * @access  Protected (Admin & Client)
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
 * @route   PUT /<admin>o<client>/api/kyc/profile/phone
 * @desc    Update user phone (requires verification)
 * @access  Protected (Admin & Client)
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
 * @route   PUT /<admin>o<client>/api/kyc/profile/password
 * @desc    Update user password
 * @access  Protected (Admin & Client)
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
 * @route   PUT /<admin>o<client>/api/kyc/profile/nationalId
 * @desc    Update user nationalId
 * @access  Protected (Admin & Client)
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

/**
 * @route   DELETE /<admin>o<client>/api/kyc/profile/delete-account
 * @desc    Delete user account
 * @access  Protected (Admin & Client)
 */
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