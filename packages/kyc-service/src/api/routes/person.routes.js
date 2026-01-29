'use strict';

const express = require('express');
const router = express.Router();
const PersonController = require('../controllers/person.controller');
const PersonValidator = require('../validators/person.validator');
const { AuthMiddleware } = require('@abundbank/shared');
const { SessionMiddleware } = require('@abundbank/shared');
const { RateLimitMiddleware } = require('@abundbank/shared');
const { RequestLockMiddleware } = require('@abundbank/shared');
const { ValidatorUtil } = require('@abundbank/shared');
const { USER_ROLES } = require('@abundbank/shared');

/**
 * @route   GET /admin/api/kyc/person
 * @desc    Lista usuarios con paginación y filtros
 * @access  Private (Admin)
 */
router.get(
  '/',
  AuthMiddleware.requireRole([USER_ROLES.ADMIN]),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  PersonValidator.listQuery(),
  ValidatorUtil.handleValidationErrors,
  PersonController.list
);

/**
 * @route   POST /admin/api/kyc/person
 * @desc    Crea un nuevo usuario
 * @access  Private (Admin)
 */
router.post(
  '/',
  AuthMiddleware.requireRole([USER_ROLES.ADMIN]),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  PersonValidator.create(),
  ValidatorUtil.handleValidationErrors,
  PersonController.create
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/activate
 * @desc    Activa un usuario desactivado
 * @access  Private (Admin)
 */
router.put(
  '/:userId/activate',
  AuthMiddleware.requireRole([USER_ROLES.ADMIN]),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  PersonValidator.activate(),
  ValidatorUtil.handleValidationErrors,
  PersonController.activate
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/deactivate
 * @desc    Desactiva un usuario activo
 * @access  Private (Admin)
 */
router.put(
  '/:userId/deactivate',
  AuthMiddleware.requireRole([USER_ROLES.ADMIN]),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  PersonValidator.deactivate(),
  ValidatorUtil.handleValidationErrors,
  PersonController.deactivate
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/reset-password
 * @desc    Resetea la contraseña de un usuario
 * @access  Private (Admin)
 */
router.put(
  '/:userId/reset-password',
  AuthMiddleware.requireRole([USER_ROLES.ADMIN]),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  PersonValidator.resetPassword(),
  ValidatorUtil.handleValidationErrors,
  PersonController.resetPassword
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/disable-mfa
 * @desc    Desactiva el MFA (TOTP) de un usuario
 * @access  Private (Admin)
 */
router.put(
  '/:userId/disable-mfa',
  AuthMiddleware.requireRole([USER_ROLES.ADMIN]),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  PersonValidator.disableMFA(),
  ValidatorUtil.handleValidationErrors,
  PersonController.disableMFA
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/email
 * @desc    Cambia el email de un usuario
 * @access  Private (Admin)
 */
router.put(
  '/:userId/email',
  AuthMiddleware.requireRole([USER_ROLES.ADMIN]),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  PersonValidator.changeEmail(),
  ValidatorUtil.handleValidationErrors,
  PersonController.changeEmail
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/national-id
 * @desc    Cambia el national_id de un usuario
 * @access  Private (Admin)
 */
router.put(
  '/:userId/national-id',
  AuthMiddleware.requireRole([USER_ROLES.ADMIN]),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  PersonValidator.changeNationalId(),
  ValidatorUtil.handleValidationErrors,
  PersonController.changeNationalId
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/role
 * @desc    Cambia el rol de un usuario
 * @access  Private (Admin)
 */
router.put(
  '/:userId/role',
  AuthMiddleware.requireRole([USER_ROLES.ADMIN]),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  PersonValidator.changeRole(),
  ValidatorUtil.handleValidationErrors,
  PersonController.changeRole
);

/**
 * @route   DELETE /admin/api/kyc/person/:userId/delete-account
 * @desc    Elimina la cuenta de un usuario
 * @access  Private (Admin)
 */
router.delete(
  '/:userId/delete-account',
  AuthMiddleware.requireRole([USER_ROLES.ADMIN]),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  PersonValidator.deleteAccount(),
  ValidatorUtil.handleValidationErrors,
  PersonController.deleteAccount
);

module.exports = router;