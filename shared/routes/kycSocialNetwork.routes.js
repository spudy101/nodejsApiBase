'use strict';

const express = require('express');
const router = express.Router();
const kycSocialNetworkController = require('../controllers/kycSocialNetwork.controller');
const kycSocialNetworkValidator = require('../validators/kycSocialNetwork.validator');
const AuthMiddleware = require('../middlewares/auth.middleware');
const SessionMiddleware = require('../middlewares/session.middleware');
const RequestLockMiddleware = require('../middlewares/requestLock.middleware');
const ValidatorUtil = require('../utils/validators.util');

/**
 * @route   GET /<admin>o<client>/api/kyc/social-networks
 * @desc    Get all user social networks
 * @access  Protected
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycSocialNetworkController.getSocialNetworks
);

/**
 * @route   POST /<admin>o<client>/api/kyc/social-networks
 * @desc    Add a new social network to user profile
 * @access  Protected
 */
router.post(
  '/',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycSocialNetworkValidator.addSocialNetwork(),
  ValidatorUtil.handleValidationErrors,
  kycSocialNetworkController.addSocialNetwork
);

/**
 * @route   PUT /<admin>o<client>/api/kyc/social-networks
 * @desc    Update an existing social network
 * @access  Protected
 */
router.put(
  '/',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycSocialNetworkValidator.updateSocialNetwork(),
  ValidatorUtil.handleValidationErrors,
  kycSocialNetworkController.updateSocialNetwork
);

/**
 * @route   DELETE /<admin>o<client>/api/kyc/social-networks
 * @desc    Delete a social network from user profile
 * @access  Protected
 */
router.delete(
  '/',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycSocialNetworkValidator.deleteSocialNetwork(),
  ValidatorUtil.handleValidationErrors,
  kycSocialNetworkController.deleteSocialNetwork
);

module.exports = router;