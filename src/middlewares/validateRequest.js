const { validationResult } = require('express-validator');
const { validationErrorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

/**
 * Middleware para validar requests usando express-validator
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    logger.warn('Errores de validación', {
      errors: errors.array(),
      url: req.originalUrl,
      method: req.method,
      userId: req.user?.id
    });

    return validationErrorResponse(res, errors.array());
  }

  next();
};

module.exports = { validateRequest };