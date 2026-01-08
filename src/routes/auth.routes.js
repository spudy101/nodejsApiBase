// src/routes/auth.routes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authValidator = require('../validators/auth.validator');
const AuthMiddleware = require('../middlewares/auth.middleware');
const RateLimitMiddleware = require('../middlewares/rateLimit.middleware');
const IdempotencyMiddleware = require('../middlewares/idempotency.middleware');
const ValidatorUtil = require('../utils/validators');
const ErrorMiddleware = require('../middlewares/error.middleware');

router.post(
  '/register',
  RateLimitMiddleware.authLimiter(),
  IdempotencyMiddleware.handleIdempotency,
  authValidator.register(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(authController.register.bind(authController))
);

router.post(
  '/login',
  RateLimitMiddleware.authLimiter(),
  authValidator.login(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(authController.login.bind(authController))
);

router.post(
  '/logout',
  AuthMiddleware.verifyToken,
  authValidator.logout(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(authController.logout.bind(authController))
);

router.post(
  '/refresh',
  RateLimitMiddleware.authLimiter(),
  authValidator.refreshToken(),
  ValidatorUtil.handleValidationErrors,
  ErrorMiddleware.asyncHandler(authController.refreshToken.bind(authController))
);

router.get(
  '/me',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(authController.me.bind(authController))
);

/**
 * ==============================================
 * Logica para cerrar y ver sesiones, segun lo guardado en cache (Estas solo son de prueba por eso no tienen dtos o validators)
 * ==============================================  
*/

/**
 * @route   GET /api/auth/sessions
 * @desc    Get active sessions
 * @access  Private
 */
router.get(
  '/sessions',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(authController.getSessions.bind(authController))
);

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Logout specific session
 * @access  Private
 */
router.delete(
  '/sessions/:sessionId',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(authController.logoutSession.bind(authController))
);

/**
 * @route   DELETE /api/auth/sessions
 * @desc    Logout all sessions
 * @access  Private
 */
router.delete(
  '/sessions',
  AuthMiddleware.verifyToken,
  ErrorMiddleware.asyncHandler(authController.logoutAllSessions.bind(authController))
);

module.exports = router;