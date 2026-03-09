'use strict';

const express           = require('express');
const router            = express.Router();
const NotificationPreferenceController = require('../controllers/notification-preference.controller');
const NotificationPreferenceValidator  = require('../validators/notification-preference.validator');
const AuthMiddleware    = require('../../../../shared/middlewares/auth.middleware');
const ValidatorUtil     = require('../../../../shared/utils/validators.util');

// Todas las rutas requieren autenticación
router.use(AuthMiddleware.authenticate);

// ============================================================
// QUERIES
// ============================================================

/**
 * GET /notification-preferences
 * Obtiene todas las preferencias del usuario (global + por tipo)
 */
router.get(
  '/',
  NotificationPreferenceController.getPreferences
);

// ============================================================
// MUTATIONS
// ============================================================

/**
 * PATCH /notification-preferences/global
 * Actualiza la preferencia global (allow_push, allow_email, quiet_hours)
 */
router.patch(
  '/global',
  NotificationPreferenceValidator.updateGlobalPreference(),
  ValidatorUtil.handleValidationErrors,
  NotificationPreferenceController.updateGlobalPreference
);

/**
 * PATCH /notification-preferences/type
 * Crea o actualiza la preferencia para un tipo de notificación específico
 */
router.patch(
  '/type',
  NotificationPreferenceValidator.updateTypePreference(),
  ValidatorUtil.handleValidationErrors,
  NotificationPreferenceController.updateTypePreference
);

/**
 * DELETE /notification-preferences/type/:notificationTypeCode
 * Elimina la preferencia de tipo — el usuario vuelve a usar la global
 */
router.delete(
  '/type/:notificationTypeCode',
  NotificationPreferenceValidator.deleteTypePreference(),
  ValidatorUtil.handleValidationErrors,
  NotificationPreferenceController.deleteTypePreference
);

/**
 * PATCH /notification-preferences/batch
 * Actualiza múltiples preferencias de tipo en una sola operación
 */
router.patch(
  '/batch',
  NotificationPreferenceValidator.batchUpdateTypePreferences(),
  ValidatorUtil.handleValidationErrors,
  NotificationPreferenceController.batchUpdateTypePreferences
);

module.exports = router;
