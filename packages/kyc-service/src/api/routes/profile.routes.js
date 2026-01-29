'use strict';

const express = require('express');
const router = express.Router();
const ProfileController = require('../controllers/profile.controller');
const ProfileValidator = require('../validators/profile.validator');
const { AuthMiddleware } = require('@abundbank/shared');
const { SessionMiddleware } = require('@abundbank/shared');
const { RateLimitMiddleware } = require('@abundbank/shared');
const { RequestLockMiddleware } = require('@abundbank/shared');
const { ValidatorUtil } = require('@abundbank/shared');

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
  ProfileController.getProfile
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
  ProfileController.getExtendedProfile
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
  ProfileController.getLocation
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
  ProfileController.getContactInfo
);

/**
 * @route   PUT /<admin>o<client>/api/kyc/profile
 * @desc    Update user profile (username, avatar, location, gender)
 * @access  Protected (Admin & Client)
 */
router.put(
  '/',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  ProfileValidator.updateProfile(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.updateProfile
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
  ProfileValidator.updateEmail(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.updateEmail
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
  ProfileValidator.updatePhone(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.updatePhone
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
  ProfileValidator.updatePassword(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.updatePassword
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
  ProfileValidator.updateNationalId(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.updateNationalId
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
  ProfileValidator.deleteAccount(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.deleteAccount
);

module.exports = router;