// src/constants/index.js

/**
 * Application constants
 * 
 * Este archivo combina:
 * 1. Configuración desde .env (importada desde config)
 * 2. Constantes fijas de la aplicación (no configurables)
 */

const config = require('../constants/config');

module.exports = {
  // ==============================================
  // IMPORTAR CONFIGURACIONES (desde .env)
  // ==============================================
  ...config,

  // ==============================================
  // TIMEOUTS Y TTLs (segundos) - VALORES FIJOS
  // ==============================================
  ttl: {
    session: 3600,              // 1 hora - Cache de sesiones
    requestLock: 2,             // 2 segundos - Lock de peticiones IP privada
    requestLockPublic: 3        // 3 segundos - Lock de peticiones IP pública
  },

  // ==============================================
  // SECURITY - Login Attempts (VALORES FIJOS)
  // ==============================================
  loginAttempts: {
    maxAttempts: 5,             // Máximo de intentos fallidos
    blockDurationMinutes: 15    // Duración del bloqueo
  },

  // ==============================================
  // SECURITY - Reset Token (VALORES FIJOS)
  // ==============================================
  security: {
    expirationMinutes: 15,       // Expiración del token de reset,
    totpIssuer: "DemocraciaLiquida"
  },

  // ==============================================
  // HTTP STATUS CODES
  // ==============================================
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503
  },

  // ==============================================
  // USER ROLES
  // ==============================================
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  },

  // ==============================================
  // ERROR CODES
  // ==============================================
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
    AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
    NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
    CONFLICT_ERROR: 'CONFLICT_ERROR',
    RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    DATABASE_ERROR: 'DATABASE_ERROR',
    IDEMPOTENCY_ERROR: 'IDEMPOTENCY_ERROR',
    REQUEST_LOCK_ERROR: 'REQUEST_LOCK_ERROR',
    TOKEN_EXPIRED_ERROR: 'TOKEN_EXPIRED_ERROR',
    TOKEN_INVALID_ERROR: 'TOKEN_INVALID_ERROR'
  },

  // ==============================================
  // SUCCESS MESSAGES
  // ==============================================
  SUCCESS: {
    USER_REGISTERED: 'Usuario registrado exitosamente',
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    LOGOUT_SUCCESS: 'Cierre de sesión exitoso',
    PROFILE_UPDATED: 'Perfil actualizado exitosamente',
    PRODUCT_CREATED: 'Producto creado exitosamente',
    PRODUCT_UPDATED: 'Producto actualizado exitosamente',
    PRODUCT_DELETED: 'Producto eliminado exitosamente'
  },

  // ==============================================
  // ERROR MESSAGES
  // ==============================================
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
  },

  // ==============================================
  // REGEX PATTERNS
  // ==============================================
  REGEX_PATTERNS: {
    EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    PHONE: /^\+?[1-9]\d{1,14}$/ // E.164 format
  }
};