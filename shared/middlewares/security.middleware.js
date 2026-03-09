// src/middlewares/security.middleware.js

'use strict';

const helmet = require('helmet');
const cors   = require('cors');
const { logger }         = require('../utils/logger.util');
const { server }         = require('../constants');

class SecurityMiddleware {
  /**
   * Helmet — configura headers de seguridad HTTP.
   */
  static helmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc:   ["'self'", "'unsafe-inline'"],
          scriptSrc:  ["'self'"],
          imgSrc:     ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge:            31536000,
        includeSubDomains: true,
        preload:           true,
      },
      frameguard: { action: 'deny' },
      noSniff:    true,
      xssFilter:  true,
    });
  }

  /**
   * CORS — soporta string único o lista separada por comas.
   * Ej: CORS_ORIGIN="https://app.com,https://admin.app.com"
   */
  static cors() {
    // Normalizar a array para soportar múltiples orígenes
    const whitelist = server.corsOrigin === '*'
      ? '*'
      : server.corsOrigin.split(',').map((o) => o.trim());

    return cors({
      origin: (origin, callback) => {
        // Permitir requests sin origin (apps móviles, curl, Postman)
        if (!origin) return callback(null, true);

        if (whitelist === '*' || server.nodeEnv === 'development') {
          return callback(null, true);
        }

        if (whitelist.includes(origin)) {
          return callback(null, true);
        }

        logger.warn('CORS blocked request', { origin });
        return callback(new Error('No permitido por CORS'));
      },
      methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type', 'Authorization', 'Idempotency-Key',
        'x-timestamp', 'x-refresh-token', 'last-event-id', 'Accept',
      ],
      exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit', 'X-Correlation-Id'],
      maxAge:         86400, // 24 horas — preflight cacheado en el browser
    });
  }

  /**
   * Headers de seguridad adicionales (complementa Helmet).
   */
  static addSecurityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.removeHeader('X-Powered-By');
    next();
  }
}

module.exports = SecurityMiddleware;