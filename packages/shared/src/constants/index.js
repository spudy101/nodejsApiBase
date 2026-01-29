// packages/shared/src/constants/index.js

/**
 * Shared Constants
 * Constantes FIJAS compartidas entre todos los servicios
 * NO incluye variables de entorno (cada servicio tiene las suyas)
 */

module.exports = {
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
    USER_VERIFIED: 'user_verified',
    USER_MILITANT: 'militante',
    USER_CANDIDATO: 'candidato',
    USER_ELECTO: 'electo',
    MODERATOR: 'moderator',
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
  // SUCCESS MESSAGES (en español)
  // ==============================================
  SUCCESS: {
    USER_REGISTERED: 'Usuario registrado exitosamente',
    LOGIN_SUCCESS: 'Inicio de sesión exitoso',
    LOGOUT_SUCCESS: 'Cierre de sesión exitoso',
    PROFILE_UPDATED: 'Perfil actualizado exitosamente',
    PRODUCT_CREATED: 'Producto creado exitosamente',
    PRODUCT_UPDATED: 'Producto actualizado exitosamente',
    PRODUCT_DELETED: 'Producto eliminado exitosamente',
    EMAIL_SENT: 'Email enviado exitosamente',
    NOTIFICATION_SENT: 'Notificación enviada exitosamente'
  },

  // ==============================================
  // ERROR MESSAGES (en español)
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
  },

  // ==============================================
  // TIMEOUTS Y TTLs (segundos) - VALORES FIJOS
  // ==============================================
  TTL: {
    SESSION: 3600,              // 1 hora - Cache de sesiones
    REQUEST_LOCK: 2,            // 2 segundos - Lock de peticiones IP privada
    REQUEST_LOCK_PUBLIC: 3,     // 3 segundos - Lock de peticiones IP pública
    VERIFICATION_CODE: 600,     // 10 minutos - Código de verificación
    RESET_TOKEN: 900            // 15 minutos - Token de reset
  },

  // ==============================================
  // SECURITY CONSTANTS
  // ==============================================
  SECURITY: {
    LOGIN_ATTEMPTS: {
      MAX_ATTEMPTS: 5,
      BLOCK_DURATION_MINUTES: 15
    },
    RESET_TOKEN: {
      EXPIRATION_MINUTES: 15
    },
    TOTP: {
      ISSUER: 'AbundBank'
    }
  },

  // ==============================================
  // NOTIFICATION TYPES
  // ==============================================
  NOTIFICATION_TYPES: {
    EMAIL: 'email',
    SMS: 'sms',
    PUSH: 'push',
    IN_APP: 'in_app'
  },

  // ==============================================
  // CACHE KEYS PREFIXES
  // ==============================================
  CACHE_KEYS: {
    SESSION: 'session:',
    USER: 'user:',
    VERIFICATION_CODE: 'verification:',
    RESET_TOKEN: 'reset:',
    REQUEST_LOCK: 'lock:',
    LOGIN_ATTEMPTS: 'login_attempts:'
  }
};