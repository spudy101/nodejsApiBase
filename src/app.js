const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const logger = require('./utils/logger');
const routes = require('./routes');
const { 
  errorHandler, 
  notFoundHandler,
  generalLimiter 
} = require('./middlewares');

const app = express();

// ==================== SECURITY ====================
// Helmet - Seguridad HTTP headers
app.use(helmet());

// CORS - Configuración de orígenes permitidos
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};
app.use(cors(corsOptions));

// ==================== MIDDLEWARE ====================
// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Morgan - HTTP request logger (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  // En producción, usar formato combined y escribir a archivo
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.http(message.trim())
    }
  }));
}

// Rate limiting general
app.use(generalLimiter);

// Trust proxy (para obtener IP real detrás de proxy/load balancer)
app.set('trust proxy', 1);

// ==================== ROUTES ====================
// API prefix
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
app.use(API_PREFIX, routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a la API',
    version: '1.0.0',
    documentation: `${req.protocol}://${req.get('host')}${API_PREFIX}/docs`,
    endpoints: {
      health: `${API_PREFIX}/health`,
      auth: `${API_PREFIX}/auth`,
      users: `${API_PREFIX}/users`,
      products: `${API_PREFIX}/products`
    }
  });
});

const swaggerDocs = require('../config/swagger');

// ==================== SWAGGER DOCUMENTATION ====================
swaggerDocs(app);

// ==================== ERROR HANDLING ====================
// 404 - Not Found
app.use(notFoundHandler);

// Error handler global
app.use(errorHandler);

module.exports = app;