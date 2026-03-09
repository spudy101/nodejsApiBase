'use strict';

const express                  = require('express');
const router                   = express.Router();
const NotificationController   = require('../controllers/notification.controller');
const NotificationValidator    = require('../validators/notification.validator');
const AuthMiddleware           = require('../../../../shared/middlewares/auth.middleware');
const RequestLockMiddleware    = require('../../../../shared/middlewares/request-lock.middleware');
const ValidatorUtil            = require('../../../../shared/utils/validators.util');

// ============================================================
// PROTECTED ROUTES — todas requieren autenticación salvo POST
// ============================================================

/**
 * GET /notifications/count/stream
 * SSE — debe ir ANTES de /count para que Express no lo confunda con /:id
 */
router.get(
  '/count/stream',
  AuthMiddleware.authenticate,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationController.streamUnreadCount
);

/**
 * GET /notifications/count
 */
router.get(
  '/count',
  AuthMiddleware.authenticate,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationController.getUnreadCount
);

/**
 * GET /notifications
 * Lista mezclada (personal + global) con paginación
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  NotificationController.getNotificationsList
);

/**
 * GET /notifications/personal
 */
router.get(
  '/personal',
  AuthMiddleware.authenticate,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  NotificationController.getPersonalNotifications
);

/**
 * GET /notifications/global
 */
router.get(
  '/global',
  AuthMiddleware.authenticate,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  NotificationController.getGlobalNotifications
);

/**
 * POST /notifications
 * Endpoint para servicios externos — usa externalAuthenticate
 */
router.post(
  '/',
  AuthMiddleware.externalAuthenticate,
  NotificationValidator.createNotification(),
  ValidatorUtil.handleValidationErrors,
  NotificationController.createNotification
);

module.exports = router;