// src/utils/validators.js
const { validationResult } = require('express-validator');
const AppError = require('./app-error.util');

class ValidatorUtil {
  /**
   * ✅ ACTUALIZADO: Lanza AppError en lugar de responder directamente
   * Esto permite que el error handler global maneje la respuesta
   * y agregue automáticamente el correlationId
   */
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }));

      // ✅ Lanzar AppError para que lo maneje el error handler global
      return next(
        AppError.unprocessableEntity('Error de validación', formattedErrors)
      );
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