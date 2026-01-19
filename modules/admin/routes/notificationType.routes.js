'use strict';

const express = require('express');
const router = express.Router();
const notificationTypeController = require('../controllers/notificationType.controller');
const RequestLockMiddleware = require('../../../shared/middlewares/requestLock.middleware');
const ValidatorUtil = require('../../../shared/utils/validators.util');
const NotificationTypeValidator = require('../validators/notificationType.validator');
const AuthMiddleware = require('../../../shared/middlewares/auth.middleware');
const SessionMiddleware = require('../../../shared/middlewares/session.middleware');

/**
 * @route   GET /admin/api/notification-types
 * @desc    Lista tipos de notificación con paginación y filtros
 * @access  Private (Admin)
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationTypeValidator.listQuery(),
  ValidatorUtil.handleValidationErrors,
  notificationTypeController.list
);

/**
 * @route   POST /admin/api/notification-types/global
 * @desc    Crea una notificación global dinámica
 * @access  Private (Admin)
 */
router.post(
  '/global',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationTypeValidator.createGlobalNotification(),
  ValidatorUtil.handleValidationErrors,
  notificationTypeController.createGlobalNotification
);

/**
 * @route   PATCH /admin/api/notification-types/:notificationTypeId
 * @desc    Actualiza un tipo de notificación
 * @access  Private (Admin)
 */
router.patch(
  '/:notificationTypeId',
  AuthMiddleware.authenticate,
  AuthMiddleware.requireRole(['admin']),
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationTypeValidator.update(),
  ValidatorUtil.handleValidationErrors,
  notificationTypeController.update
);

module.exports = router;