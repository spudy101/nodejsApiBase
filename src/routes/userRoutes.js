const express = require('express');
const router = express.Router();
const { userController } = require('../controllers');
const { 
  authenticate,
  authorize
} = require('../middlewares');
const {
  uuidParamValidation,
  paginationValidation
} = require('../validators');
const { validateRequest } = require('../middlewares/validateRequest');
const { body } = require('express-validator');

// Todos los endpoints requieren autenticación y rol admin
router.use(authenticate);
router.use(authorize('admin'));

/**
 * @route   GET /api/v1/users/stats
 * @desc    Obtener estadísticas de usuarios
 * @access  Private (Admin)
 * @note    Esta ruta debe ir ANTES de /users/:id para evitar conflictos
 */
router.get(
  '/stats',
  userController.getUserStats
);

/**
 * @route   GET /api/v1/users
 * @desc    Listar todos los usuarios con filtros
 * @access  Private (Admin)
 */
router.get(
  '/',
  paginationValidation,
  validateRequest,
  userController.listUsers
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Obtener usuario por ID
 * @access  Private (Admin)
 */
router.get(
  '/:id',
  uuidParamValidation('id'),
  validateRequest,
  userController.getUserById
);

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Actualizar rol de usuario
 * @access  Private (Admin)
 */
router.put(
  '/:id/role',
  uuidParamValidation('id'),
  body('role')
    .notEmpty().withMessage('El rol es requerido')
    .isIn(['user', 'admin']).withMessage('El rol debe ser user o admin'),
  validateRequest,
  userController.updateUserRole
);

/**
 * @route   PUT /api/v1/users/:id/activate
 * @desc    Activar usuario
 * @access  Private (Admin)
 */
router.put(
  '/:id/activate',
  uuidParamValidation('id'),
  validateRequest,
  userController.activateUser
);

/**
 * @route   PUT /api/v1/users/:id/deactivate
 * @desc    Desactivar usuario
 * @access  Private (Admin)
 */
router.put(
  '/:id/deactivate',
  uuidParamValidation('id'),
  validateRequest,
  userController.deactivateUser
);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Eliminar usuario permanentemente
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  uuidParamValidation('id'),
  validateRequest,
  userController.deleteUser
);

module.exports = router;