'use strict';

const express = require('express');
const router = express.Router();
const kycPersonController = require('../controllers/kycPerson.controller');
const RequestLockMiddleware = require('../../../shared/middlewares/requestLock.middleware');
const ValidatorUtil = require('../../../shared/utils/validators.util');
const KycPersonValidator = require('../validators/kycPerson.validator');
const AuthMiddleware = require('../../../shared/middlewares/auth.middleware');
const SessionMiddleware = require('../../../shared/middlewares/session.middleware');

/**
 * @route   GET /admin/api/kyc/person
 * @desc    Lista usuarios con paginación y filtros
 * @access  Private (Admin)
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycPersonValidator.listQuery(),
  ValidatorUtil.handleValidationErrors,
  kycPersonController.list
);

/**
 * @route   PUT /admin/api/kyc/person
 * @desc    Crea un nuevo usuario
 * @access  Private (Admin)
 */
router.put(
  '/',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycPersonValidator.create(),
  ValidatorUtil.handleValidationErrors,
  kycPersonController.create
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/activate
 * @desc    Activa un usuario desactivado
 * @access  Private (Admin)
 */
router.put(
  '/:userId/activate',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycPersonValidator.activate(),
  ValidatorUtil.handleValidationErrors,
  kycPersonController.activate
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/deactivate
 * @desc    Desactiva un usuario activo
 * @access  Private (Admin)
 */
router.put(
  '/:userId/deactivate',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycPersonValidator.deactivate(),
  ValidatorUtil.handleValidationErrors,
  kycPersonController.deactivate
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/reset-password
 * @desc    Resetea la contraseña de un usuario
 * @access  Private (Admin)
 */
router.put(
  '/:userId/reset-password',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycPersonValidator.resetPassword(),
  ValidatorUtil.handleValidationErrors,
  kycPersonController.resetPassword
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/disable-mfa
 * @desc    Desactiva el MFA (TOTP) de un usuario
 * @access  Private (Admin)
 */
router.put(
  '/:userId/disable-mfa',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycPersonValidator.disableMFA(),
  ValidatorUtil.handleValidationErrors,
  kycPersonController.disableMFA
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/email
 * @desc    Cambia el email de un usuario
 * @access  Private (Admin)
 */
router.put(
  '/:userId/email',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycPersonValidator.changeEmail(),
  ValidatorUtil.handleValidationErrors,
  kycPersonController.changeEmail
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/national-id
 * @desc    Cambia el national_id de un usuario
 * @access  Private (Admin)
 */
router.put(
  '/:userId/national-id',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycPersonValidator.changeNationalId(),
  ValidatorUtil.handleValidationErrors,
  kycPersonController.changeNationalId
);

/**
 * @route   PUT /admin/api/kyc/person/:userId/role
 * @desc    Cambia el rol de un usuario
 * @access  Private (Admin)
 */
router.put(
  '/:userId/role',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycPersonValidator.changeRole(),
  ValidatorUtil.handleValidationErrors,
  kycPersonController.changeRole
);

/**
 * @route   DELETE /admin/api/kyc/person/:userId/delete-account
 * @desc    Elimina la cuenta de un usuario
 * @access  Private (Admin)
 */
router.delete(
  '/:userId/delete-account',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  KycPersonValidator.deleteAccount(),
  ValidatorUtil.handleValidationErrors,
  kycPersonController.deleteAccount
);

module.exports = router;