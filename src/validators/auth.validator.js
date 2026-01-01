// src/validators/auth.validator.js
const { body } = require('express-validator');

class AuthValidator {
  static register() {
    return [
      body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
      
      body('password')
        .trim()
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 6, max: 100 }).withMessage('La contraseña debe tener entre 6 y 100 caracteres')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
      
      body('name')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('El nombre solo puede contener letras y espacios'),
      
      body('role')
        .optional()
        .isIn(['user', 'admin']).withMessage('El rol debe ser user o admin')
    ];
  }

  static login() {
    return [
      body('email')
        .trim()
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('Debe ser un email válido')
        .normalizeEmail(),
      
      body('password')
        .trim()
        .notEmpty().withMessage('La contraseña es requerida')
    ];
  }

  static refreshToken() {
    return [
      body('refreshToken')
        .trim()
        .notEmpty().withMessage('El refresh token es requerido')
    ];
  }
}

module.exports = AuthValidator;