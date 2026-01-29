// shared/src/middlewares/security.middleware.js
'use strict';

const helmet = require('helmet');
const cors = require('cors');
const { logger } = require('../utils/logger.util');

// Singleton para almacenar la config una vez inicializado
let serverConfig = null;

class SecurityMiddleware {
  /**
   * Inicializa el middleware con la configuración del servicio
   * Llamar UNA VEZ al inicio de cada servicio en server.js
   * 
   * @param {Object} config - Configuración completa del servicio
   * @param {Object} config.server - Configuración del servidor
   * @param {string} config.server.nodeEnv - Ambiente (development, production, etc.)
   * @param {string[]} config.server.corsOrigin - Lista de orígenes permitidos para CORS
   */
  static initialize(config) {
    if (!config || !config.server) {
      throw new Error('SecurityMiddleware.initialize() requiere config.server');
    }

    serverConfig = config.server;
    logger.info('SecurityMiddleware initialized', {
      nodeEnv: serverConfig.nodeEnv,
      corsOrigins: serverConfig.corsOrigin?.length || 0
    });
  }

  /**
   * Valida que el middleware esté inicializado
   * @private
   */
  static _ensureInitialized() {
    if (!serverConfig) {
      throw new Error(
        'SecurityMiddleware no inicializado. Llamar SecurityMiddleware.initialize(config) en server.js'
      );
    }
  }

  /**
   * Configure Helmet security headers
   * 
   * @returns {Function} Express middleware
   */
  static helmet() {
    this._ensureInitialized();

    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      },
      frameguard: {
        action: 'deny'
      },
      noSniff: true,
      xssFilter: true
    });
  }

  /**
   * Configure CORS
   * 
   * @returns {Function} Express middleware
   */
  static cors() {
    this._ensureInitialized();

    const whitelist = serverConfig.corsOrigin;

    return cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (whitelist.indexOf(origin) !== -1 || serverConfig.nodeEnv === 'development') {
          callback(null, true);
        } else {
          logger.warn('CORS blocked request', { origin });
          callback(new Error('No permitido por CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key'],
      exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
      maxAge: 86400 // 24 hours
    });
  }

  /**
   * Add security headers manually
   * 
   * @param {Object} req - Express request
   * @param {Object} res - Express response
   * @param {Function} next - Express next function
   */
  static addSecurityHeaders(req, res, next) {
    // No necesita validación de inicialización porque no usa config
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.removeHeader('X-Powered-By');
    next();
  }
}

module.exports = SecurityMiddleware;