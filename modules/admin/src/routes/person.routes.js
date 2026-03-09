'use strict';

const express           = require('express');
const router            = express.Router();
const PersonController  = require('../controllers/person.controller');
const PersonValidator   = require('../validators/person.validator');
const AuthMiddleware    = require('../../../../shared/middlewares/auth.middleware');
const ValidatorUtil     = require('../../../../shared/utils/validators.util');

// Todas las rutas de person requieren autenticación y rol admin
router.use(AuthMiddleware.requireRole('admin'));

// ============================================================
// QUERIES
// ============================================================

/**
 * GET /persons
 * Lista usuarios con paginación, filtros y búsqueda
 */
router.get(
  '/',
  PersonValidator.list(),
  ValidatorUtil.handleValidationErrors,
  PersonController.list
);

/**
 * GET /persons/:userId
 * Obtiene un usuario por ID (perfil completo)
 */
router.get(
  '/:userId',
  PersonValidator.getById(),
  ValidatorUtil.handleValidationErrors,
  PersonController.getById
);

// ============================================================
// MUTATIONS
// ============================================================

/**
 * POST /persons
 * Crea un nuevo usuario
 */
router.post(
  '/',
  PersonValidator.create(),
  ValidatorUtil.handleValidationErrors,
  PersonController.create
);

/**
 * PATCH /persons/:userId/activate
 * Activa un usuario
 */
router.patch(
  '/:userId/activate',
  PersonValidator.activate(),
  ValidatorUtil.handleValidationErrors,
  PersonController.activate
);

/**
 * PATCH /persons/:userId/deactivate
 * Desactiva un usuario
 */
router.patch(
  '/:userId/deactivate',
  PersonValidator.deactivate(),
  ValidatorUtil.handleValidationErrors,
  PersonController.deactivate
);

/**
 * POST /persons/:userId/reset-password
 * Resetea la contraseña de un usuario (genera temporal)
 */
router.post(
  '/:userId/reset-password',
  PersonValidator.resetPassword(),
  ValidatorUtil.handleValidationErrors,
  PersonController.resetPassword
);

/**
 * PUT /persons/:userId/email
 * Cambia el email de un usuario
 */
router.put(
  '/:userId/email',
  PersonValidator.changeEmail(),
  ValidatorUtil.handleValidationErrors,
  PersonController.changeEmail
);

/**
 * PUT /persons/:userId/national-id
 * Cambia el national_id de un usuario
 */
router.put(
  '/:userId/national-id',
  PersonValidator.changeNationalId(),
  ValidatorUtil.handleValidationErrors,
  PersonController.changeNationalId
);

/**
 * PATCH /persons/:userId/disable-mfa
 * Desactiva el MFA de un usuario
 */
router.patch(
  '/:userId/disable-mfa',
  PersonValidator.disableMFA(),
  ValidatorUtil.handleValidationErrors,
  PersonController.disableMFA
);

/**
 * PUT /persons/:userId/role
 * Cambia el rol de un usuario
 */
router.put(
  '/:userId/role',
  PersonValidator.changeRole(),
  ValidatorUtil.handleValidationErrors,
  PersonController.changeRole
);

/**
 * DELETE /persons/:userId
 * Elimina la cuenta de un usuario (requiere contraseña del admin)
 */
router.delete(
  '/:userId',
  PersonValidator.deleteAccount(),
  ValidatorUtil.handleValidationErrors,
  PersonController.deleteAccount
);

module.exports = router;
