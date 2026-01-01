// src/utils/validators.js
const { validationResult } = require('express-validator');
const ApiResponse = require('./response');
const { HTTP_STATUS } = require('../constants');

class ValidatorUtil {
  /**
   * Handle validation errors
   */
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));

      return ApiResponse.validationError(res, formattedErrors);
    }

    next();
  }

  /**
   * Validate UUID
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Sanitize object
   */
  static sanitizeObject(obj, allowedFields) {
    const sanitized = {};
    allowedFields.forEach(field => {
      if (obj[field] !== undefined) {
        sanitized[field] = obj[field];
      }
    });
    return sanitized;
  }

  /**
   * Validate pagination params
   */
  static validatePagination(page, limit, maxLimit = 100) {
    const validPage = Math.max(1, parseInt(page) || 1);
    const validLimit = Math.min(maxLimit, Math.max(1, parseInt(limit) || 10));
    return { page: validPage, limit: validLimit };
  }
}

module.exports = ValidatorUtil;