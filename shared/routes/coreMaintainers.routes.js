'use strict';

const express = require('express');
const router = express.Router();
const maintainersController = require('../controllers/coreMaintainers.controller');
const RateLimitMiddleware = require('../middlewares/rateLimit.middleware');
const RequestLockMiddleware = require('../middlewares/requestLock.middleware');
const ValidatorUtil = require('../utils/validators.util');
const MaintainersValidator = require('../validators/coreMaintainers.validator');

/**
 * PUBLIC ROUTES (No authentication required)
 */

/**
 * @route   GET /<admin>o<client>/api/core-maintainers/genders
 * @desc    List genders with pagination
 * @access  Public
 */
router.get(
  '/genders',
  RateLimitMiddleware.publicLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  MaintainersValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  maintainersController.listGenders
);

/**
 * @route   GET /<admin>o<client>/api/core-maintainers/phone-prefixes
 * @desc    List phone prefixes with pagination
 * @access  Public
 */
router.get(
  '/phone-prefixes',
  RateLimitMiddleware.publicLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  MaintainersValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  maintainersController.listPhonePrefixes
);

/**
 * @route   GET /<admin>o<client>/api/core-maintainers/departments
 * @desc    List departments with pagination
 * @access  Public
 */
router.get(
  '/departments',
  RateLimitMiddleware.publicLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  MaintainersValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  maintainersController.listDepartments
);

/**
 * @route   GET /<admin>o<client>/api/core-maintainers/countries
 * @desc    List countries with pagination
 * @access  Public
 */
router.get(
  '/countries',
  RateLimitMiddleware.publicLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  MaintainersValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  maintainersController.listCountries
);

/**
 * @route   GET /<admin>o<client>/api/core-maintainers/cities
 * @desc    List cities with pagination
 * @access  Public
 */
router.get(
  '/cities',
  RateLimitMiddleware.publicLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  MaintainersValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  maintainersController.listCities
);

/**
 * @route   GET /<admin>o<client>/api/core-maintainers/avatars
 * @desc    List avatars with pagination
 * @access  Public
 */
router.get(
  '/avatars',
  RateLimitMiddleware.publicLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  MaintainersValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  maintainersController.listAvatars
);

/**
 * @route   GET /<admin>o<client>/api/core-maintainers/avatar-themes
 * @desc    List avatar themes with pagination
 * @access  Public
 */
router.get(
  '/avatar-themes',
  RateLimitMiddleware.publicLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  MaintainersValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  maintainersController.listAvatarThemes
);

/**
 * @route   GET /<admin>o<client>/api/core-maintainers/notification-types
 * @desc    List notification types with pagination
 * @access  Public
 */
router.get(
  '/notification-types',
  RateLimitMiddleware.publicLimiter(),
  RequestLockMiddleware.forPublicEndpoints(),
  MaintainersValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  maintainersController.listNotificationTypes
);

module.exports = router;