// src/constants/messages.js
module.exports = {
  // Success Messages
  SUCCESS: {
    USER_REGISTERED: 'Usuario registrado exitosamente',
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    LOGOUT_SUCCESS: 'Cierre de sesión exitoso',
    PROFILE_UPDATED: 'Perfil actualizado exitosamente',
    PRODUCT_CREATED: 'Producto creado exitosamente',
    PRODUCT_UPDATED: 'Producto actualizado exitosamente',
    PRODUCT_DELETED: 'Producto eliminado exitosamente'
  },

  // Error Messages
  ERRORS: {
    // Authentication
    INVALID_CREDENTIALS: 'Credenciales inválidas',
    ACCOUNT_BLOCKED: 'Cuenta bloqueada temporalmente. Intente más tarde',
    UNAUTHORIZED: 'No autorizado',
    TOKEN_EXPIRED: 'Token expirado',
    TOKEN_INVALID: 'Token inválido',
    TOKEN_REQUIRED: 'Token requerido',
    
    // User
    USER_NOT_FOUND: 'Usuario no encontrado',
    USER_ALREADY_EXISTS: 'El usuario ya existe',
    USER_INACTIVE: 'Usuario inactivo',
    
    // Product
    PRODUCT_NOT_FOUND: 'Producto no encontrado',
    INSUFFICIENT_STOCK: 'Stock insuficiente',
    
    // General
    INTERNAL_ERROR: 'Error interno del servidor',
    VALIDATION_ERROR: 'Error de validación',
    RATE_LIMIT_EXCEEDED: 'Límite de peticiones excedido',
    REQUEST_LOCKED: 'Solicitud en proceso. Por favor espere',
    DUPLICATE_REQUEST: 'Solicitud duplicada detectada',
    FORBIDDEN: 'Acceso denegado'
  }
};