// src/app.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Importaciones locales
const routes = require('./routes');
const { setupSwagger } = require('./config/swagger');

const app = express();

// ===================================
// MIDDLEWARES DE SEGURIDAD
// ===================================
app.use(helmet());

// ===================================
// CONFIGURACIÓN DE CORS
// ===================================
if (process.env.NODE_ENV === 'development') {
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
  }));
} else {
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || false,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'token']
  }));
}

// ===================================
// LOGGING
// ===================================
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ===================================
// PARSERS DE BODY Y COOKIES
// ===================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ===================================
// CONFIGURACIONES ESPECÍFICAS
// ===================================
// Configurar Swagger (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  setupSwagger(app);
}

// ===================================
// RUTAS PRINCIPALES
// ===================================
// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime()
  });
});

// Rutas de la API
app.use('/', routes);

// ===================================
// MANEJO DE ERRORES
// ===================================
// Ruta no encontrada (404)
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}` 
  });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error Handler:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Error interno del servidor' 
      : err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;