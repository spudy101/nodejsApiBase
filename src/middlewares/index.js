const { errorHandler, notFoundHandler } = require('./errorHandler');
const { generalLimiter, authLimiter, createLimiter } = require('./rateLimiter');
const { requestLock } = require('./requestLock');
const { 
  authenticate, 
  authorize, 
  authorizeOwnerOrAdmin,
  optionalAuth 
} = require('./authMiddleware');
const { validateRequest } = require('./validateRequest');

module.exports = {
  // Error handling
  errorHandler,
  notFoundHandler,
  
  // Rate limiting
  generalLimiter,
  authLimiter,
  createLimiter,
  
  // Request lock
  requestLock,
  
  // Authentication & Authorization
  authenticate,
  authorize,
  authorizeOwnerOrAdmin,
  optionalAuth,
  
  // Validation
  validateRequest
};