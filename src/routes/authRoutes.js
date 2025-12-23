const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { 
  authenticate,

} = require('../middlewares');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation
} = require('../validators');
const { validateRequest } = require('../middlewares/validateRequest');

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registro de usuario
 * @access  Public
 */
router.post(
  '/register',
  registerValidation,
  validateRequest,
  authController.register
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Inicio de sesion
 * @access  Private (Admin o Usuario)
 */
router.post(
  '/login',
  loginValidation,
  validateRequest,
  authController.login
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    obtener informacion del usuario mediante jwt
 * @access  Private (Admin o Usuario)
 */
router.get(
  '/profile',
  authenticate,
  authController.getProfile
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Actualizar informacion del usuario
 * @access  Private (Admin o Usuario)
 */
router.put(
  '/profile',
  authenticate,
  updateProfileValidation,
  validateRequest,
  authController.updateProfile
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Actualizar password del usuario
 * @access  Private (Admin o Usuario)
 */
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  validateRequest,
  authController.changePassword
);

/**
 * @route   PUT /api/v1/auth/profile
 * @desc    Eliminar cuenta del usuario
 * @access  Private (Admin o Usuario)
 */
router.delete(
  '/account',
  authenticate,
  authController.deactivateAccount
);

module.exports = router;