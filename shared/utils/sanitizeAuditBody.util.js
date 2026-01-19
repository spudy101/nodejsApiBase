// src/utils/sanitizeAuditBody.js
const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_LENGTH = 10;
const MAX_DEPTH = 3; // Nueva: Evitar objetos muy anidados

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
  // Añade más según tu app
];

/**
 * Sanitiza objetos para logs/auditoría
 * - Redacta campos sensibles
 * - Trunca strings/arrays largos
 * - Maneja objetos anidados hasta MAX_DEPTH
 */
function sanitizeAuditBody(body, depth = 0) {
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
        sanitizeAuditBody(item, depth + 1)
      );
      return [...truncated, `...[${body.length - MAX_ARRAY_LENGTH} more items]`];
    }
    return body.map(item => sanitizeAuditBody(item, depth + 1));
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
      safe[key] = sanitizeAuditBody(value, depth + 1);
    }
    // Objetos anidados
    else if (value && typeof value === 'object') {
      // Si es Date, mantenerlo
      if (value instanceof Date) {
        safe[key] = value.toISOString();
      } else {
        safe[key] = sanitizeAuditBody(value, depth + 1);
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
function sanitizeErrorContext(context) {
  return {
    ...sanitizeAuditBody(context),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  };
}

module.exports = {
  sanitizeAuditBody,
  sanitizeErrorContext,
  SENSITIVE_FIELDS // Por si quieres extenderlo en otro módulo
};