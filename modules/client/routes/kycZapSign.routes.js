'use strict';

const express = require('express');
const router = express.Router();
const kycZapSignController = require('../controllers/kycZapSign.controller');
const kycZapSignValidator = require('../validators/kycZapSign.validator');
const AuthMiddleware = require('../../../shared/middlewares/auth.middleware');
const SessionMiddleware = require('../../../shared/middlewares/session.middleware');
const RequestLockMiddleware = require('../../../shared/middlewares/requestLock.middleware');
const ValidatorUtil = require('../../../shared/utils/validators.util');

/**
 * @route   POST /client/api/kyc/zapsign/generate-url
 * @desc    Genera URL de ZapSign para validación de identidad
 * @access  Protected (authenticated users)
 */
router.post(
  '/generate-url',
  AuthMiddleware.authenticate,
  SessionMiddleware.validateSession,
  RequestLockMiddleware.forAuthenticatedUsers(),
  kycZapSignValidator.generateUrl(),
  ValidatorUtil.handleValidationErrors,
  kycZapSignController.generateUrl
);

/**
 * @route   POST /client/api/kyc/zapsign/webhook
 * @desc    Webhook de ZapSign para procesar eventos de validación
 * @access  Public (external service with API Key in query)
 */
router.post(
  '/webhook',
  AuthMiddleware.externalWebhookAuthenticate,
  kycZapSignController.processWebhook
);

module.exports = router;