'use strict';

const express        = require('express');
const router         = express.Router();
const MFAController  = require('../controllers/mfa.controller');
const MFAValidator   = require('../validators/mfa.validator');
const AuthMiddleware = require('../../../../shared/middlewares/auth.middleware');
const ValidatorUtil  = require('../../../../shared/utils/validators.util');

// Todas las rutas de MFA requieren autenticación
router.use(AuthMiddleware.authenticate);

// ============================================================
// TOTP
// ============================================================

/**
 * POST /mfa/totp/setup
 * Genera secret code y otpauth URL para configurar el autenticador
 */
router.post(
  '/totp/setup',
  MFAValidator.setupTOTP(),
  ValidatorUtil.handleValidationErrors,
  MFAController.setupTOTP
);

/**
 * POST /mfa/totp/verify-activate
 * Verifica el código TOTP y activa MFA si es correcto
 */
router.post(
  '/totp/verify-activate',
  MFAValidator.verifyAndActivateTOTP(),
  ValidatorUtil.handleValidationErrors,
  MFAController.verifyAndActivateTOTP
);

/**
 * POST /mfa/totp/verify
 * Verifica un código TOTP (login MFA u otras validaciones)
 */
router.post(
  '/totp/verify',
  MFAValidator.verifyTOTP(),
  ValidatorUtil.handleValidationErrors,
  MFAController.verifyTOTP
);

/**
 * DELETE /mfa/totp
 * Desactiva TOTP — requiere contraseña del usuario
 */
router.delete(
  '/totp',
  MFAValidator.deactivateTOTP(),
  ValidatorUtil.handleValidationErrors,
  MFAController.deactivateTOTP
);

// ============================================================
// VALIDACIÓN DE CONTRASEÑA
// ============================================================

/**
 * POST /mfa/validate-password
 * Valida la contraseña del usuario (útil para flujos de seguridad en el frontend)
 */
router.post(
  '/validate-password',
  MFAValidator.validatePassword(),
  ValidatorUtil.handleValidationErrors,
  MFAController.validatePassword
);

module.exports = router;
