// packages/client-gateway/src/server.js

/**
 * Client Gateway - API Gateway for Client Applications
 * 
 * Responsabilidades:
 * 1. Proxy requests a microservicios
 * 2. Autenticación de usuarios
 * 3. Rate limiting
 * 4. Logging centralizado
 */

require('dotenv').config();

const express = require('express');
const compression = require('compression');
const { createProxyMiddleware } = require('http-proxy-middleware');
const SecurityMiddleware = require('@abundbank/shared');
const CorrelationMiddleware = require('@abundbank/shared');
const ErrorMiddleware = require('@abundbank/shared');
const { httpLogger, logger } = require('@abundbank/shared');

// ============================================
// CONFIGURATION
// ============================================
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Microservices URLs
const KYC_SERVICE_URL = process.env.KYC_SERVICE_URL || 'http://localhost:4001';
const NOTIFICATIONS_SERVICE_URL = process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:4002';

// ============================================
// EXPRESS APP
// ============================================
const app = express();

// Trust proxy
app.set('trust proxy', 1);

// ============================================
// MIDDLEWARES
// ============================================

// 1. Correlation ID
app.use(CorrelationMiddleware.addCorrelationId);

// 2. Security
app.use(SecurityMiddleware.helmet());
app.use(SecurityMiddleware.cors());
app.use(SecurityMiddleware.addSecurityHeaders);

// 3. Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Compression
app.use(compression());

// 5. HTTP logger
app.use(httpLogger);

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    service: 'client-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    correlationId: req.correlationId,
    microservices: {
      kyc: KYC_SERVICE_URL,
      notifications: NOTIFICATIONS_SERVICE_URL
    }
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Client Gateway',
    version: '1.0.0',
    service: 'client-gateway',
    correlationId: req.correlationId,
  });
});

// ============================================
// PROXY ROUTES
// ============================================

// Proxy options
const proxyOptions = {
  changeOrigin: true,
  logLevel: NODE_ENV === 'development' ? 'debug' : 'warn',
  onProxyReq: (proxyReq, req, res) => {
    // Forward correlation ID
    if (req.correlationId) {
      proxyReq.setHeader('X-Correlation-ID', req.correlationId);
    }
    
    // Forward original IP
    if (req.ip) {
      proxyReq.setHeader('X-Forwarded-For', req.ip);
    }
  },
  onError: (err, req, res) => {
    logger.error('Proxy error', {
      error: err.message,
      correlationId: req.correlationId,
      url: req.url
    });
    
    res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable',
      correlationId: req.correlationId
    });
  }
};

// KYC Service routes
app.use('/api/kyc', createProxyMiddleware({
  target: KYC_SERVICE_URL,
  pathRewrite: {
    '^/api/kyc': '/api'
  },
  ...proxyOptions
}));

// Notifications Service routes
app.use('/api/notifications', createProxyMiddleware({
  target: NOTIFICATIONS_SERVICE_URL,
  pathRewrite: {
    '^/api/notifications': '/api'
  },
  ...proxyOptions
}));

// ============================================
// ERROR HANDLERS
// ============================================
app.use(ErrorMiddleware.handleNotFound);
app.use(ErrorMiddleware.handleError);

// ============================================
// START SERVER
// ============================================
const server = app.listen(PORT, HOST, () => {
  logger.info('=================================================');
  logger.info('🎉 CLIENT GATEWAY RUNNING');
  logger.info('=================================================');
  logger.info(`🌐 Server: http://${HOST}:${PORT}`);
  logger.info(`📊 Environment: ${NODE_ENV}`);
  logger.info(`❤️  Health: http://${HOST}:${PORT}/health`);
  logger.info('');
  logger.info('🔗 Proxying to:');
  logger.info(`   - KYC Service: ${KYC_SERVICE_URL}`);
  logger.info(`   - Notifications: ${NOTIFICATIONS_SERVICE_URL}`);
  logger.info('=================================================');
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
const gracefulShutdown = (signal) => {
  logger.info(`\n${signal} received, shutting down gracefully...`);
  
  server.close(() => {
    logger.info('✅ HTTP server closed');
    logger.info('🎉 Graceful shutdown completed');
    process.exit(0);
  });

  // Force shutdown after timeout
  setTimeout(() => {
    logger.error('❌ Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = server;