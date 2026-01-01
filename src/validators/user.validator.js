// src/validators/user.validator.js
const { body, param } = require('express-validator');

class UserValidator {
  static updateProfile() {
    return [
      body('name')
        .optional()
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),
      
      body('email')
        .optional()
        .trim()
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
      
      body('password')
        .optional()
        .trim()
        .isLength({ min: 6, max: 100 }).withMessage('La contraseña debe tener entre 6 y 100 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
      
      body('currentPassword')
        .if(body('password').exists())
        .notEmpty().withMessage('La contraseña actual es requerida para cambiar la contraseña')
    ];
  }

  static getUserById() {
    return [
      param('id')
        .trim()
        .notEmpty().withMessage('El ID es requerido')
        .isUUID().withMessage('El ID debe ser un UUID válido')
    ];
  }
}

module.exports = UserValidator;