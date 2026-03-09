// src/constants/index.js

/**
 * Application constants
 *
 * Contiene ÚNICAMENTE constantes fijas de la aplicación.
 * Nada de este archivo depende de variables de entorno.
 * La configuración de entorno vive en src/config/index.js
 */

'use strict';

// ==============================================
// TTLs — tiempos de vida en caché (segundos)
// ==============================================

const TTL = {
  SESSION:              3600,  // 1 hora  — caché de sesiones
  REQUEST_LOCK:         2,     // 2 seg   — lock de peticiones en red privada
  REQUEST_LOCK_PUBLIC:  3,     // 3 seg   — lock de peticiones en red pública
};

// ==============================================
// RATE LIMITING
// ==============================================

const RATE_LIMIT = {
  WINDOW_MS:         900_000,  // 15 minutos
  MAX_REQUESTS:      100,
  AUTH_WINDOW_MS:    1_000,    // 1 segundo
  AUTH_MAX_REQUESTS: 10,
};

// ==============================================
// LOGIN ATTEMPTS
// ==============================================

const LOGIN_ATTEMPTS = {
  MAX_ATTEMPTS:           5,   // Intentos fallidos antes de bloquear
  BLOCK_DURATION_MINUTES: 15,  // Duración del bloqueo
};

// ==============================================
// SECURITY
// ==============================================

const SECURITY = {
  RESET_TOKEN_EXPIRATION_MINUTES: 15,
  TOTP_ISSUER: 'aerolinea',
};

// ==============================================
// HTTP STATUS CODES
// ==============================================

const HTTP_STATUS = {
  OK:                    200,
  CREATED:               201,
  NO_CONTENT:            204,
  BAD_REQUEST:           400,
  UNAUTHORIZED:          401,
  FORBIDDEN:             403,
  NOT_FOUND:             404,
  CONFLICT:              409,
  UNPROCESSABLE_ENTITY:  422,
  TOO_MANY_REQUESTS:     429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE:   503,
};

// ==============================================
// USER ROLES
// ==============================================

const USER_ROLES = {
  USER:          'user',
  USER_VERIFIED: 'user_verified',
  ADMIN:         'admin',
  SUPER_ADMIN:   'super_admin',
};

// ==============================================
// ERROR CODES — identificadores internos
// ==============================================

const ERROR_CODES = {
  VALIDATION_ERROR:     'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR:  'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR:      'NOT_FOUND_ERROR',
  CONFLICT_ERROR:       'CONFLICT_ERROR',
  RATE_LIMIT_ERROR:     'RATE_LIMIT_ERROR',
  INTERNAL_ERROR:       'INTERNAL_ERROR',
  DATABASE_ERROR:       'DATABASE_ERROR',
  IDEMPOTENCY_ERROR:    'IDEMPOTENCY_ERROR',
  REQUEST_LOCK_ERROR:   'REQUEST_LOCK_ERROR',
  TOKEN_EXPIRED_ERROR:  'TOKEN_EXPIRED_ERROR',
  TOKEN_INVALID_ERROR:  'TOKEN_INVALID_ERROR',
};

// ==============================================
// SUCCESS MESSAGES
// ==============================================

const SUCCESS_MESSAGES = {
  USER_REGISTERED: 'Usuario registrado exitosamente',
  LOGIN_SUCCESS:   'Inicio de sesión exitoso',
  LOGOUT_SUCCESS:  'Cierre de sesión exitoso',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente',
  PRODUCT_CREATED: 'Producto creado exitosamente',
  PRODUCT_UPDATED: 'Producto actualizado exitosamente',
  PRODUCT_DELETED: 'Producto eliminado exitosamente',
};

// ==============================================
// ERROR MESSAGES — mensajes legibles para el cliente
// ==============================================

const ERROR_MESSAGES = {
  // Auth
  INVALID_CREDENTIALS: 'Credenciales inválidas',
  ACCOUNT_BLOCKED:     'Cuenta bloqueada temporalmente. Intente más tarde',
  UNAUTHORIZED:        'No autorizado',
  TOKEN_EXPIRED:       'Token expirado',
  TOKEN_INVALID:       'Token inválido',
  TOKEN_REQUIRED:      'Token requerido',

  // User
  USER_NOT_FOUND:      'Usuario no encontrado',
  USER_ALREADY_EXISTS: 'El usuario ya existe',
  USER_INACTIVE:       'Usuario inactivo',

  // Product
  PRODUCT_NOT_FOUND:   'Producto no encontrado',
  INSUFFICIENT_STOCK:  'Stock insuficiente',

  // General
  INTERNAL_ERROR:      'Error interno del servidor',
  VALIDATION_ERROR:    'Error de validación',
  RATE_LIMIT_EXCEEDED: 'Límite de peticiones excedido',
  REQUEST_LOCKED:      'Solicitud en proceso. Por favor espere',
  DUPLICATE_REQUEST:   'Solicitud duplicada detectada',
  FORBIDDEN:           'Acceso denegado',
};

// ==============================================
// REGEX PATTERNS
// ==============================================

const REGEX = {
  EMAIL:    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  UUID:     /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d])[a-zA-Z\d\S]{8,}$/,
  PHONE:    /^\+?[1-9]\d{1,14}$/,  // E.164 format
};

// ==============================================
// CONFIG — variables de entorno (desde src/config/index.js)
// Se importa aquí para tener UN solo punto de entrada en la app.
// Uso: const { server, database, aws, ... } = require('src/constants');
// ==============================================

const config = require('./config');

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
  // Config (env vars)
  ...config,

  // Constantes fijas
  TTL,
  RATE_LIMIT,
  LOGIN_ATTEMPTS,
  SECURITY,
  HTTP_STATUS,
  USER_ROLES,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  ERROR_MESSAGES,
  REGEX,
};