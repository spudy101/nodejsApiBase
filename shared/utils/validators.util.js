// src/utils/validators.js
const { validationResult } = require('express-validator');
const ApiResponse = require('./response.util');

class ValidatorUtil {
  /**
   * ✅ MANTENER: Handle validation errors
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
   * ✅ MANTENER: Validate UUID
   */
  static isValidUUID(uuid) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

}

module.exports = ValidatorUtil;