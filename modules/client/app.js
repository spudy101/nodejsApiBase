// modules/client/app.js
const express = require('express');
const compression = require('compression');
const SecurityMiddleware = require('../../shared/middlewares/security.middleware');
const ErrorMiddleware = require('../../shared/middlewares/error.middleware');
const auditContextMiddleware = require('../../shared/middlewares/audit.middleware');
const { httpLogger } = require('../../shared/utils/logger.util');

// Swagger específico de CLIENT
const swaggerClientDocs = require('../../config/swagger.client');

// ==========================================
// RUTAS COMPARTIDAS
// ==========================================
const sharedAuthRoutes = require('../../shared/routes/auth.routes');
const sharedCoreMaintainersRoutes = require('../../shared/routes/coreMaintainers.routes');
const sharedKycMFARoutes = require('../../shared/routes/kycMFA.routes');
const sharedKycNotificationPreferenceRoutes = require('../../shared/routes/kycNotificationPreference.routes');
const sharedKycProfileRoutes = require('../../shared/routes/kycProfile.routes');
const sharedKycSocialNetworkRoutes = require('../../shared/routes/kycSocialNetwork.routes');
const sharedNotificationRoutes = require('../../shared/routes/notification.routes');

// ==========================================
// RUTAS ESPECÍFICAS DEL CLIENTE
// ==========================================
const clientAuthRoutes = require('./routes/auth.routes');
const clientSendVerificationRoutes = require('./routes/sendVerification.routes');

class ClientApp {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupSwagger();
    this.setupRoutes();
    this.setupErrorHandlers();
  }

  setupMiddlewares() {
    // Trust proxy (importante para obtener IP real detrás de nginx/cloudflare)
    this.app.set('trust proxy', 1);

    // Security headers
    this.app.use(SecurityMiddleware.helmet());
    this.app.use(SecurityMiddleware.cors());
    this.app.use(SecurityMiddleware.addSecurityHeaders);

    // Body parsers
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Audit context (debe ir después de body parsers)
    this.app.use(auditContextMiddleware);

    // Compression
    this.app.use(compression());

    // HTTP request logger
    this.app.use(httpLogger);
  }

  setupSwagger() {
    // Configurar Swagger específico de CLIENT
    swaggerClientDocs(this.app);
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        status: 'healthy',
        service: 'client',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Root route
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to Democracia Líquida - Client API',
        version: '1.0.0',
        service: 'client',
        documentation: '/client/docs'
      });
    });

    // ==========================================
    // MONTAR RUTAS COMPARTIDAS
    // ==========================================
    this.app.use('/api/auth', sharedAuthRoutes);
    this.app.use('/api/core-maintainers', sharedCoreMaintainersRoutes);
    this.app.use('/api/kyc/mfa', sharedKycMFARoutes);
    this.app.use('/api/kyc/notification-preferences', sharedKycNotificationPreferenceRoutes);
    this.app.use('/api/kyc/profile', sharedKycProfileRoutes);
    this.app.use('/api/kyc/social-networks', sharedKycSocialNetworkRoutes);
    this.app.use('/api/notifications', sharedNotificationRoutes);

    // ==========================================
    // MONTAR RUTAS ESPECÍFICAS DEL CLIENTE
    // ==========================================
    this.app.use('/api/auth', clientAuthRoutes);
    this.app.use('/api/verification', clientSendVerificationRoutes);

    // TODO: Agregar más rutas específicas del cliente aquí
    // Ejemplo: proposals, votes, delegations, etc.
  }

  setupErrorHandlers() {
    // 404 handler
    this.app.use(ErrorMiddleware.handleNotFound);

    // Global error handler (debe ser el último)
    this.app.use(ErrorMiddleware.handleError);
  }

  getApp() {
    return this.app;
  }
}

module.exports = new ClientApp().getApp();