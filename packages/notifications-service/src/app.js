// packages/kyc-service/src/app.js

const express = require('express');
const compression = require('compression');

// ✅ CORRECTO - Destructurar todo lo que necesitas
const {
  SecurityMiddleware,
  CorrelationMiddleware,
  ErrorMiddleware,
  AuditMiddleware,
  httpLogger
} = require('@abundbank/shared');

class KycApp {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  setupMiddlewares() {
    this.app.set('trust proxy', 1);

    // 1. Correlation ID
    this.app.use(CorrelationMiddleware.addCorrelationId);

    // 2. Security headers
    this.app.use(SecurityMiddleware.helmet());
    this.app.use(SecurityMiddleware.cors());
    this.app.use(SecurityMiddleware.addSecurityHeaders);

    // 3. Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 4. Audit context
    this.app.use(AuditMiddleware);

    // 5. Compression
    this.app.use(compression());

    // 6. HTTP logger
    this.app.use(httpLogger);
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        status: 'healthy',
        service: 'kyc-service',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        correlationId: req.correlationId,
      });
    });

    // Root route
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to KYC Service',
        version: '1.0.0',
        service: 'kyc-service',
        correlationId: req.correlationId,
      });
    });
  }

  setupErrorHandlers() {
    // 404 handler
    this.app.use(ErrorMiddleware.handleNotFound);

    // Global error handler
    this.app.use(ErrorMiddleware.handleError);
  }

  getApp() {
    return this.app;
  }
}

module.exports = new KycApp().getApp();