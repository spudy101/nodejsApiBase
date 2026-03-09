// src/utils/logger.util.js

'use strict';

const path            = require('path');
const winston         = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { server, logging } = require('../constants');

// ==============================================
// SANITIZE — absorbido desde sanitizeAuditBody.util.js
// ==============================================

const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_LENGTH  = 10;
const MAX_DEPTH         = 3;

const SENSITIVE_FIELDS = [
  'password', 'token', 'refreshToken', 'accessToken',
  'secret', 'apiKey', 'authorization', 'cookie', 'sessionId',
];

/**
 * Sanitiza objetos para logs/auditoría.
 * - Redacta campos sensibles
 * - Trunca strings y arrays largos
 * - Limita profundidad de objetos anidados
 * @param {any} body
 * @param {number} depth
 * @returns {any}
 */
const sanitizeForLog = (body, depth = 0) => {
  if (!body || typeof body !== 'object') return body;
  if (depth > MAX_DEPTH) return '[max depth reached]';

  if (Array.isArray(body)) {
    const items = body.slice(0, MAX_ARRAY_LENGTH).map((item) => sanitizeForLog(item, depth + 1));
    return body.length > MAX_ARRAY_LENGTH
      ? [...items, `...[${body.length - MAX_ARRAY_LENGTH} more items]`]
      : items;
  }

  const safe = {};
  for (const [key, value] of Object.entries(body)) {
    const isSensitive = SENSITIVE_FIELDS.some((f) => key.toLowerCase().includes(f.toLowerCase()));
    if (isSensitive) {
      safe[key] = '[REDACTED]';
      continue;
    }

    if (typeof value === 'string') {
      safe[key] = value.length > MAX_STRING_LENGTH
        ? `${value.slice(0, MAX_STRING_LENGTH)}...[truncated]`
        : value;
    } else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      value === null
    ) {
      safe[key] = value;
    } else if (value instanceof Date) {
      safe[key] = value.toISOString();
    } else if (Array.isArray(value)) {
      safe[key] = sanitizeForLog(value, depth + 1);
    } else if (typeof value === 'object') {
      safe[key] = sanitizeForLog(value, depth + 1);
    } else {
      safe[key] = String(value);
    }
  }

  return safe;
};

// ==============================================
// FORMATS
// ==============================================

const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// ==============================================
// TRANSPORTS
// ==============================================

const transports = [
  new winston.transports.Console({
    format: consoleFormat,
    level: logging.level || 'info',
  }),
  new DailyRotateFile({
    filename:       path.join('logs', 'error-%DATE%.log'),
    datePattern:    'YYYY-MM-DD',
    level:          'error',
    format:         jsonFormat,
    maxSize:        '20m',
    maxFiles:       '14d',
    zippedArchive:  true,
  }),
  new DailyRotateFile({
    filename:       path.join('logs', 'combined-%DATE%.log'),
    datePattern:    'YYYY-MM-DD',
    format:         jsonFormat,
    maxSize:        '20m',
    maxFiles:       '14d',
    zippedArchive:  true,
  }),
];

// ==============================================
// LOGGER INSTANCE
// ==============================================

const logger = winston.createLogger({
  level:       logging.level || 'info',
  format:      jsonFormat,
  transports,
  exitOnError: false,
});

// ==============================================
// AUDIT LOG
// ==============================================

/**
 * Registra una acción de auditoría.
 * @param {string} action
 * @param {string|null} userId
 * @param {object} details
 * @param {object} context
 */
const logAudit = (action, userId, details = {}, context = {}) => {
  logger.info('AUDIT', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    details,
    ...context,
  });
};

// ==============================================
// HTTP LOGGER MIDDLEWARE
// ==============================================

/**
 * Middleware que loguea cada request HTTP al finalizar.
 */
const httpLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const logData = {
      correlationId: req.correlationId,
      method:        req.method,
      url:           req.originalUrl,
      status:        res.statusCode,
      duration:      `${Date.now() - start}ms`,
      ip:            req.ip,
      userAgent:     req.get('user-agent'),
      userId:        req.user?.userId,
    };

    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.info('HTTP Request', logData);
    }
  });

  next();
};

// ==============================================
// EXPORTS
// ==============================================

module.exports = {
  logger,
  logAudit,
  httpLogger,
  sanitizeForLog,     // Exportado para uso en audit.middleware y error.middleware
  SENSITIVE_FIELDS,   // Exportado por si algún módulo necesita extenderlo
};