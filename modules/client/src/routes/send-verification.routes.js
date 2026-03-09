'use strict';

const express           = require('express');
const router            = express.Router();
const SendVerificationController = require('../controllers/send-verification.controller');
const SendVerificationValidator  = require('../validators/send-verification.validator');
const ValidatorUtil     = require('../../../../shared/utils/validators.util');

// ============================================================
// Rutas públicas — no requieren autenticación
// El usuario aún no está logueado cuando verifica email/teléfono
// (registro, recuperación de contraseña, etc.)
// ============================================================

/**
 * POST /verification/send
 * Envía código de verificación a email o teléfono
 */
router.post(
  '/send',
  SendVerificationValidator.sendVerificationCode(),
  ValidatorUtil.handleValidationErrors,
  SendVerificationController.sendVerificationCode
);

/**
 * POST /verification/verify
 * Verifica el código recibido
 */
router.post(
  '/verify',
  SendVerificationValidator.verifyCode(),
  ValidatorUtil.handleValidationErrors,
  SendVerificationController.verifyCode
);

module.exports = router;
