// src/constants/index.js

/**
 * Parse environment variable as integer with default value
 */
const parseIntEnv = (value, defaultValue) => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse environment variable as boolean
 */
const parseBoolEnv = (value) => {
  return value === 'true';
};

module.exports = {
  // HTTP Status Codes
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

  // JWT Configuration
  JWT: {
    ACCESS_TOKEN_EXPIRY: process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m',
    REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d',
    ISSUER: process.env.JWT_ISSUER || 'api-backend',
    AUDIENCE: process.env.JWT_AUDIENCE || 'api-client'
  },

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000), // 15 minutes
    MAX_REQUESTS: parseIntEnv(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
    AUTH_WINDOW_MS: parseIntEnv(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 15 * 60 * 1000),
    AUTH_MAX_REQUESTS: parseIntEnv(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS, 10),
    SKIP_SUCCESS: false
  },

  // Login Attempts
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS: parseIntEnv(process.env.LOGIN_MAX_ATTEMPTS, 5),
    BLOCK_DURATION_MS: parseIntEnv(process.env.LOGIN_BLOCK_DURATION_MS, 15 * 60 * 1000), // 15 minutes
    RESET_AFTER_MS: parseIntEnv(process.env.LOGIN_RESET_AFTER_MS, 60 * 60 * 1000) // 1 hour
  },

  // Redis Keys (no necesitan ser configurables)
  REDIS_KEYS: {
    RATE_LIMIT: 'rate_limit:',
    REQUEST_LOCK: 'req_lock:',
    IDEMPOTENCY: 'idempotency:',
    BLACKLIST_TOKEN: 'blacklist:token:',
    USER_SESSION: 'session:user:',
    REFRESH_TOKEN: 'refresh:token:'
  },

  // Redis TTL (in seconds)
  REDIS_TTL: {
    RATE_LIMIT: parseIntEnv(process.env.REDIS_TTL_RATE_LIMIT, 900), // 15 minutes
    REQUEST_LOCK: parseIntEnv(process.env.REDIS_TTL_REQUEST_LOCK, 30), // 30 seconds
    IDEMPOTENCY: parseIntEnv(process.env.REDIS_TTL_IDEMPOTENCY, 86400), // 24 hours
    BLACKLIST_TOKEN: parseIntEnv(process.env.REDIS_TTL_BLACKLIST_TOKEN, 900), // 15 minutes
    REFRESH_TOKEN: parseIntEnv(process.env.REDIS_TTL_REFRESH_TOKEN, 604800) // 7 days
  },

  // User Roles
  USER_ROLES: {
    USER: 'user',
    ADMIN: 'admin'
  },

  // Audit Actions
  AUDIT_ACTIONS: {
    USER_REGISTER: 'USER_REGISTER',
    USER_LOGIN: 'USER_LOGIN',
    USER_LOGOUT: 'USER_LOGOUT',
    USER_UPDATE_PROFILE: 'USER_UPDATE_PROFILE',
    USER_VIEW_PROFILE: 'USER_VIEW_PROFILE',
    PRODUCT_CREATE: 'PRODUCT_CREATE',
    PRODUCT_UPDATE: 'PRODUCT_UPDATE',
    PRODUCT_DELETE: 'PRODUCT_DELETE',
    PRODUCT_VIEW: 'PRODUCT_VIEW',
    PRODUCT_LIST: 'PRODUCT_LIST'
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: parseIntEnv(process.env.PAGINATION_DEFAULT_PAGE, 1),
    DEFAULT_LIMIT: parseIntEnv(process.env.PAGINATION_DEFAULT_LIMIT, 10),
    MAX_LIMIT: parseIntEnv(process.env.PAGINATION_MAX_LIMIT, 100)
  },

  // Request Lock
  REQUEST_LOCK: {
    TIMEOUT_MS: parseIntEnv(process.env.REQUEST_LOCK_TIMEOUT_MS, 30000) // 30 seconds
  },

  // Error Codes (no necesitan ser configurables)
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
    REQUEST_LOCK_ERROR: 'REQUEST_LOCK_ERROR'
  },

  // Validation Messages (no necesitan ser configurables)
  VALIDATION_MESSAGES: {
    REQUIRED_FIELD: 'Este campo es requerido',
    INVALID_EMAIL: 'Email inválido',
    INVALID_UUID: 'UUID inválido',
    MIN_LENGTH: 'Longitud mínima no cumplida',
    MAX_LENGTH: 'Longitud máxima excedida',
    INVALID_FORMAT: 'Formato inválido'
  }
};