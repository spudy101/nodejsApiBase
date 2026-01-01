// src/middlewares/security.middleware.js
const helmet = require('helmet');
const cors = require('cors');
const { logger } = require('../utils/logger');

class SecurityMiddleware {
  /**
   * Helmet security headers
   */
  static helmet() {
    return helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:']
        }
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    });
  }

  /**
   * CORS configuration
   */
  static cors() {
    const whitelist = process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',')
      : ['http://localhost:3000', 'http://localhost:3001'];

    return cors({
      origin: (origin, callback) => {
        if (!origin || whitelist.includes(origin)) {
          callback(null, true);
        } else {
          logger.warn('CORS blocked request', { origin });
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
    });
  }

  /**
   * Add custom security headers
   */
  static addSecurityHeaders(req, res, next) {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  }

  /**
   * 🔥 NUEVO: Sanitización de input para prevenir inyecciones
   * Elimina objetos anidados que pueden ser explotados por Sequelize
   */
  static sanitizeInput() {
    return (req, res, next) => {
      try {
        // Sanitizar query params
        if (req.query && typeof req.query === 'object') {
          req.query = this.sanitizeObject(req.query);
        }

        // Sanitizar body
        if (req.body && typeof req.body === 'object') {
          req.body = this.sanitizeObject(req.body);
        }

        // Sanitizar params (solo strings, no debería tener objetos)
        if (req.params && typeof req.params === 'object') {
          req.params = this.sanitizeObject(req.params);
        }

        next();
      } catch (error) {
        logger.error('Sanitization error', { error: error.message });
        return res.status(400).json({
          success: false,
          message: 'Invalid input format',
          code: 'INVALID_INPUT'
        });
      }
    };
  }

  /**
   * Sanitiza recursivamente un objeto
   * Elimina keys peligrosas y objetos anidados no permitidos
   */
  static sanitizeObject(obj, depth = 0) {
    // Prevenir recursión infinita
    if (depth > 5) {
      return {};
    }

    // Si no es objeto, retornar como está
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    // Si es array, sanitizar cada elemento
    if (Array.isArray(obj)) {
      return obj.map(item => 
        typeof item === 'object' 
          ? this.sanitizeObject(item, depth + 1) 
          : item
      );
    }

    const sanitized = {};
    const dangerousKeys = ['$', '.', '__proto__', 'constructor', 'prototype'];

    for (const [key, value] of Object.entries(obj)) {
      // Bloquear keys que contienen caracteres peligrosos
      if (dangerousKeys.some(dangerous => key.includes(dangerous))) {
        logger.warn('Blocked dangerous key', { key, value });
        continue; // Skip esta key
      }

      // Si el valor es un objeto, verificar si es un operador de Sequelize
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const keys = Object.keys(value);
        
        // Detectar objetos que parecen operadores ($gt, $lt, $ne, etc.)
        const hasOperators = keys.some(k => k.startsWith('$'));
        
        if (hasOperators) {
          logger.warn('Blocked Sequelize operator injection', { key, value });
          continue; // Skip objetos con operadores
        }

        // Si es objeto legítimo, sanitizar recursivamente
        sanitized[key] = this.sanitizeObject(value, depth + 1);
      } else {
        // Valores primitivos o arrays se pasan directamente
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Prevenir HTTP Parameter Pollution
   */
  static preventHPP() {
    return (req, res, next) => {
      // Si un parámetro se repite, tomar solo el primero
      Object.keys(req.query).forEach(key => {
        if (Array.isArray(req.query[key])) {
          req.query[key] = req.query[key][0];
          logger.warn('HPP detected and prevented', { key });
        }
      });
      next();
    };
  }
}

module.exports = SecurityMiddleware;
