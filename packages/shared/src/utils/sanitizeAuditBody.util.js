// shared/src/utils/sanitizeAuditBody.util.js

const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_LENGTH = 10;
const MAX_DEPTH = 3;

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'refreshToken',
  'accessToken',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
  'sessionId',
];

class SanitizeAuditBodyUtil {
  constructor() {
    this.serverConfig = null;
    this.initialized = false;
  }

  /**
   * Inicializa el util con la configuración del servicio
   * @param {object} serverConfig - { nodeEnv }
   */
  initialize(serverConfig) {
    if (this.initialized) {
      throw new Error('SanitizeAuditBodyUtil already initialized');
    }

    this.serverConfig = serverConfig;
    this.initialized = true;
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new Error('SanitizeAuditBodyUtil not initialized. Call initialize(config.server) in server.js first.');
    }
  }

  /**
   * Sanitiza objetos para logs/auditoría
   * - Redacta campos sensibles
   * - Trunca strings/arrays largos
   * - Maneja objetos anidados hasta MAX_DEPTH
   */
  sanitizeAuditBody(body, depth = 0) {
    // Casos base
    if (!body || typeof body !== 'object') {
      return body;
    }

    if (depth > MAX_DEPTH) {
      return '[Max depth reached]';
    }

    // Manejar arrays
    if (Array.isArray(body)) {
      if (body.length > MAX_ARRAY_LENGTH) {
        const truncated = body.slice(0, MAX_ARRAY_LENGTH).map(item => 
          this.sanitizeAuditBody(item, depth + 1)
        );
        return [...truncated, `...[${body.length - MAX_ARRAY_LENGTH} more items]`];
      }
      return body.map(item => this.sanitizeAuditBody(item, depth + 1));
    }

    // Manejar objetos
    const safe = {};

    for (const [key, value] of Object.entries(body)) {
      // Redactar campos sensibles (case-insensitive)
      if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        safe[key] = '[REDACTED]';
        continue;
      }

      // Strings
      if (typeof value === 'string') {
        safe[key] = value.length > MAX_STRING_LENGTH 
          ? value.slice(0, MAX_STRING_LENGTH) + '...[truncated]'
          : value;
      } 
      // Números y booleanos
      else if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
        safe[key] = value;
      }
      // Arrays
      else if (Array.isArray(value)) {
        safe[key] = this.sanitizeAuditBody(value, depth + 1);
      }
      // Objetos anidados
      else if (value && typeof value === 'object') {
        // Si es Date, mantenerlo
        if (value instanceof Date) {
          safe[key] = value.toISOString();
        } else {
          safe[key] = this.sanitizeAuditBody(value, depth + 1);
        }
      }
      // Otros tipos (undefined, function, symbol)
      else {
        safe[key] = String(value);
      }
    }

    return safe;
  }

  /**
   * Sanitiza objetos específicamente para logs de error
   * Añade contexto adicional
   */
  sanitizeErrorContext(context) {
    this._checkInitialized();
    
    return {
      ...this.sanitizeAuditBody(context),
      timestamp: new Date().toISOString(),
      environment: this.serverConfig.nodeEnv
    };
  }
}

const sanitizeUtil = new SanitizeAuditBodyUtil();

module.exports = {
  sanitizeAuditBody: (body, depth) => sanitizeUtil.sanitizeAuditBody(body, depth),
  sanitizeErrorContext: (context) => sanitizeUtil.sanitizeErrorContext(context),
  SENSITIVE_FIELDS,
  // Exportar la instancia para poder inicializarla
  _instance: sanitizeUtil
};