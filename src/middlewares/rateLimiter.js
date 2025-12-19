const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * Rate limiter general para toda la API
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests por ventana
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde',
    timestamp: new Date().toISOString()
  },
  standardHeaders: true, // Incluir headers RateLimit-*
  legacyHeaders: false, // Deshabilitar headers X-RateLimit-*
  handler: (req, res) => {
    logger.warn('Rate limit excedido', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });
    
    res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones, por favor intenta más tarde',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Rate limiter para creación de recursos
 */
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 20, // 20 creaciones por hora
  message: {
    success: false,
    message: 'Has alcanzado el límite de creación de recursos, intenta más tarde',
    timestamp: new Date().toISOString()
  }
});

module.exports = {
  generalLimiter,
  createLimiter
};