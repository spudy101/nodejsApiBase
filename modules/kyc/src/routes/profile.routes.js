'use strict';

const express             = require('express');
const router              = express.Router();
const ProfileController   = require('../controllers/profile.controller');
const ProfileValidator    = require('../validators/profile.validator');
const AuthMiddleware      = require('../../../../shared/middlewares/auth.middleware');
const RequestLockMiddleware = require('../../../../shared/middlewares/request-lock.middleware');
const ValidatorUtil       = require('../../../../shared/utils/validators.util');

// Todas las rutas de profile requieren autenticación
router.use(AuthMiddleware.authenticate);

// ============================================================
// QUERIES
// ============================================================

/**
 * GET /profile
 * Perfil básico: User + Person + Contact + Avatar + Role
 */
router.get(
  '/',
  RequestLockMiddleware.forAuthenticatedUsers(),
  ProfileController.getProfile
);

/**
 * GET /profile/full
 * Perfil completo: agrega Location + Gender + Nationality
 */
router.get(
  '/full',
  RequestLockMiddleware.forAuthenticatedUsers(),
  ProfileController.getFullProfile
);

// ============================================================
// MUTATIONS
// ============================================================

/**
 * PATCH /profile
 * Actualiza: username, avatarId, genderId, location
 */
router.patch(
  '/',
  RequestLockMiddleware.forAuthenticatedUsers(),
  ProfileValidator.updateProfile(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.updateProfile
);

/**
 * PUT /profile/email
 */
router.put(
  '/email',
  RequestLockMiddleware.forAuthenticatedUsers(),
  ProfileValidator.updateEmail(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.updateEmail
);

/**
 * PUT /profile/phone
 */
router.put(
  '/phone',
  RequestLockMiddleware.forAuthenticatedUsers(),
  ProfileValidator.updatePhone(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.updatePhone
);

/**
 * PUT /profile/password
 */
router.put(
  '/password',
  RequestLockMiddleware.forAuthenticatedUsers(),
  ProfileValidator.updatePassword(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.updatePassword
);

/**
 * PUT /profile/national-id
 */
router.put(
  '/national-id',
  RequestLockMiddleware.forAuthenticatedUsers(),
  ProfileValidator.updateNationalId(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.updateNationalId
);

/**
 * DELETE /profile
 */
router.delete(
  '/',
  RequestLockMiddleware.forAuthenticatedUsers(),
  ProfileValidator.deleteAccount(),
  ValidatorUtil.handleValidationErrors,
  ProfileController.deleteAccount
);

module.exports = router;