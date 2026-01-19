'use strict';

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const NotificationValidator = require('../validators/notification.validator');
const AuthMiddleware = require('../middlewares/auth.middleware');
const SessionMiddleware = require('../middlewares/session.middleware');
const RequestLockMiddleware = require('../middlewares/requestLock.middleware');
const ValidatorUtil = require('../utils/validators.util');

/**
 * @route   GET /<admin>o<client>/api/notifications/count/stream
 * @desc    Stream SSE para contador de notificaciones en tiempo real
 * @access  Private
 */
router.get(
  '/count/stream',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  notificationController.streamUnreadCount
);

/**
 * @route   GET /<admin>o<client>/api/notifications/count
 * @desc    Obtiene el contador de notificaciones no leídas (REST)
 * @access  Private
 */
router.get(
  '/count',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  notificationController.getUnreadCount
);

/**
 * @route   GET /<admin>o<client>/api/notifications
 * @desc    Obtiene lista de notificaciones mezcladas (personal + global) con paginación
 * @access  Private
 */
router.get(
  '/',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  notificationController.getNotificationsList
);

/**
 * @route   GET /<admin>o<client>/api/notifications/personal
 * @desc    Obtiene solo notificaciones personales con paginación
 * @access  Private
 */
router.get(
  '/personal',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  notificationController.getPersonalNotifications
);

/**
 * @route   GET /<admin>o<client>/api/notifications/global
 * @desc    Obtiene solo notificaciones globales con paginación
 * @access  Private
 */
router.get(
  '/global',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  NotificationValidator.paginationQuery(),
  ValidatorUtil.handleValidationErrors,
  notificationController.getGlobalNotifications
);

/**
 * @route   POST /<admin>o<client>/api/notifications
 * @desc    Crea una notificación (endpoint para servicios externos)
 * @access  Public
 */
router.post(
  '/',
  AuthMiddleware.externalAuthenticate,
  NotificationValidator.createNotification(),
  ValidatorUtil.handleValidationErrors,
  notificationController.createNotification
);

module.exports = router;