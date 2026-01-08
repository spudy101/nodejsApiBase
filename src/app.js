// src/app.js
const express = require('express');
const compression = require('compression');
const SecurityMiddleware = require('./middlewares/security.middleware');
const RateLimitMiddleware = require('./middlewares/rateLimit.middleware');
const ErrorMiddleware = require('./middlewares/error.middleware');
const auditContextMiddleware = require('./middlewares/audit.middleware');
const { httpLogger } = require('./utils/logger');
const routes = require('./routes');

class App {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  setupMiddlewares() {
    this.app.set('trust proxy', 1);

    // Security
    this.app.use(SecurityMiddleware.helmet());
    this.app.use(SecurityMiddleware.cors());
    this.app.use(SecurityMiddleware.addSecurityHeaders);

    // Body parsers PRIMERO
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Contexto audit
    this.app.use(auditContextMiddleware);

    // Compression
    this.app.use(compression());

    // HTTP logger
    this.app.use(httpLogger);

    // Rate limit
    this.app.use(RateLimitMiddleware.apiLimiter());
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', routes);

    // Root route
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to the API',
        version: '1.0.0',
        documentation: '/api/health'
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

module.exports = new App().getApp();
