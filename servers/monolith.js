// servers/monolith.js

'use strict';

// ============================================
// 1. CARGAR .ENV — siempre lo primero
// ============================================
require('dotenv').config();

// ============================================
// 2. VALIDAR CONFIGURACIÓN — fail-fast
// Si falta alguna variable crítica el proceso
// termina aquí antes de importar nada más.
// ============================================
const { server, workers } = require('../shared/constants');

// ============================================
// 3. IMPORTS — solo después de validar config
// ============================================
const express     = require('express');
const db          = require('../shared/models');
const redisClient = require('../shared/utils/redis.util');
const { logger }  = require('../shared/utils/logger.util');
const ErrorMiddleware = require('../shared/middlewares/error.middleware');
const notificationWorker = require('../modules/notification/workers/notificationWorker');

const clientApp = require('../modules/client/app');
const adminApp  = require('../modules/admin/app');

// ============================================
// SERVER
// ============================================

class MonolithServer {
  constructor() {
    this.app    = express();
    this.server = null;
    this._setupRoutes();
  }

  _setupRoutes() {
    // Health check global — sin autenticación, muestra estado real de servicios
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success:     true,
        status:      'healthy',
        timestamp:   new Date().toISOString(),
        uptime:      process.uptime(),
        environment: server.nodeEnv,
        services: {
          client: 'running',
          admin:  'running',
          redis:  redisClient.isAvailable() ? 'connected' : 'disconnected',
        },
      });
    });

    this.app.get('/', (req, res) => {
      res.status(200).json({
        success:     true,
        message:     'Monolith API',
        version:     '1.0.0',
        mode:        'monolith',
        environment: server.nodeEnv,
        endpoints: {
          client: '/client',
          admin:  '/admin',
          health: '/health',
        },
        documentation: {
          client: '/client/docs',
          admin:  '/admin/docs',
        },
      });
    });

    // Sub-aplicaciones — cada una gestiona sus propios middlewares y Swagger
    this.app.use('/admin',  adminApp);
    this.app.use('/client', clientApp);

    // 404 global — para rutas que no caen en ninguna sub-app
    this.app.use(ErrorMiddleware.handleNotFound);
  }

  async start() {
    try {
      logger.info('=================================================');
      logger.info('🚀 STARTING MONOLITH SERVER');
      logger.info(`   Environment : ${server.nodeEnv}`);
      logger.info(`   Host        : ${server.host}`);
      logger.info(`   Port        : ${server.port}`);
      logger.info('=================================================');

      // Redis — opcional, el sistema funciona sin él
      await redisClient.connect();
      if (redisClient.isAvailable()) {
        logger.info('✅ Redis connected');
      } else {
        logger.warn('⚠️  Redis not available — running with local cache');
      }

      // Base de datos — requerida, falla si no conecta
      logger.info('Connecting to database...');
      await db.sequelize.authenticate();
      logger.info('✅ Database connected');

      // Workers
      logger.info(workers.enabled ? '✅ Workers enabled' : 'ℹ️  Workers disabled');
      if (workers.enabled) notificationWorker.iniciar();

      // HTTP server
      this.server = this.app.listen(server.port, server.host, () => {
        logger.info('=================================================');
        logger.info('🎉 SERVER RUNNING');
        logger.info(`   🌐  http://${server.host}:${server.port}`);
        logger.info(`   ❤️   http://${server.host}:${server.port}/health`);
        logger.info(`   👥  http://${server.host}:${server.port}/client`);
        logger.info(`   🔐  http://${server.host}:${server.port}/admin`);
        logger.info(`   📚  http://${server.host}:${server.port}/client/docs`);
        logger.info(`   📚  http://${server.host}:${server.port}/admin/docs`);
        logger.info('=================================================');
      });

      this._setupGracefulShutdown();
    } catch (error) {
      logger.error('❌ Failed to start server', { error: error.message, stack: error.stack });
      process.exit(1);
    }
  }

  _setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`${signal} received — starting graceful shutdown...`);

      // Forzar cierre tras 10 segundos si algo cuelga
      // unref() evita que el timer mantenga el proceso vivo artificialmente
      const forceExit = setTimeout(() => {
        logger.error('❌ Forced shutdown — timeout exceeded');
        process.exit(1);
      }, 10_000).unref();

      try {
        if (this.server) {
          await new Promise((resolve) => this.server.close(resolve));
          logger.info('✅ HTTP server closed');
        }

        await db.sequelize.close();
        logger.info('✅ Database closed');

        await redisClient.disconnect();
        logger.info('✅ Redis closed');

        clearTimeout(forceExit);
        logger.info('🎉 Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('❌ Error during shutdown', { error: error.message });
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT',  () => shutdown('SIGINT'));

    // Errores no controlados — loguear siempre, matar proceso solo en producción
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception', { message: error?.message, stack: error?.stack });
      if (server.nodeEnv === 'production') process.exit(1);
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('❌ Unhandled Rejection', {
        message: reason?.message,
        stack:   reason?.stack,
      });
      if (server.nodeEnv === 'production') process.exit(1);
    });
  }
}

// ============================================
// ARRANCAR
// ============================================
const monolithServer = new MonolithServer();
monolithServer.start();

module.exports = monolithServer;