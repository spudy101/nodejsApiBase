// modules/client/app.js

'use strict';

const express      = require('express');
const compression  = require('compression');

const SecurityMiddleware    = require('../../shared/middlewares/security.middleware');
const CorrelationMiddleware = require('../../shared/middlewares/correlation.middleware');
const ErrorMiddleware       = require('../../shared/middlewares/error.middleware');
const auditMiddleware       = require('../../shared/middlewares/audit.middleware');
const { httpLogger }        = require('../../shared/utils/logger.util');

const swaggerClientDocs = require('../../config/swagger.client');

const authLoginRoutes = require('../kyc/src/routes/auth-login.routes');
const profileRoutes = require('../kyc/src/routes/profile.routes');
const notificationRoutes = require('../notification/src/routes/notification.routes');
const mfaRoutes = require('../kyc/src/routes/mfa.routes');
const notificationPreferenceRoutes = require('../kyc/src/routes/notification-preference.routes');

const authRegisterRoutes = require('../client/src/routes/auth-register.routes');
const sendVerificationRoutes = require('../client/src/routes/send-verification.routes');

class ClientApp {
  constructor() {
    this.app = express();
    this._setupMiddlewares();
    this._setupSwagger();
    this._setupRoutes();
    this._setupErrorHandlers();
  }

  _setupMiddlewares() {
    // Trust proxy — necesario para obtener IP real detrás de nginx/cloudflare
    this.app.set('trust proxy', 1);

    // ⚠️ ORDEN CRÍTICO — no reordenar
    this.app.use(CorrelationMiddleware.addCorrelationId); // 1. Correlation ID (siempre primero)
    this.app.use(SecurityMiddleware.helmet());            // 2. Security headers
    this.app.use(SecurityMiddleware.cors());
    this.app.use(SecurityMiddleware.addSecurityHeaders);
    this.app.use(express.json({ limit: '10mb' }));        // 3. Body parsers
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(auditMiddleware);                        // 4. Audit context (necesita body parseado)
    this.app.use(compression());                          // 5. Compression
    this.app.use(httpLogger);                             // 6. HTTP logger
  }

  _setupSwagger() {
    swaggerClientDocs(this.app);
  }

  _setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success:       true,
        status:        'healthy',
        service:       'client',
        timestamp:     new Date().toISOString(),
        uptime:        process.uptime(),
        correlationId: req.correlationId,
      });
    });

    this.app.get('/', (req, res) => {
      res.status(200).json({
        success:       true,
        message:       'Client API',
        version:       '1.0.0',
        service:       'client',
        documentation: '/client/docs',
        correlationId: req.correlationId,
      });
    });

    // ==========================================
    // RUTAS COMPARTIDAS
    // ==========================================
    this.app.use('/auth', authLoginRoutes);
    this.app.use('/profile', profileRoutes);
    this.app.use('/notifications', notificationRoutes);
    this.app.use('/mfa', mfaRoutes);
    this.app.use('/notification-preferences', notificationPreferenceRoutes);

    // ==========================================
    // RUTAS ESPECÍFICAS DEL CLIENTE
    // ==========================================
    this.app.use('/auth', authRegisterRoutes);
    this.app.use('/verification', sendVerificationRoutes);
  }

  _setupErrorHandlers() {
    this.app.use(ErrorMiddleware.handleNotFound); // 404 — antes del handler global
    this.app.use(ErrorMiddleware.handleError);    // Handler global — siempre el último
  }

  getApp() {
    return this.app;
  }
}

module.exports = new ClientApp().getApp();