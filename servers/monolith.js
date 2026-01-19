// servers/monolith.js

// ============================================
// 1. CARGAR .ENV PRIMERO
// ============================================
require('dotenv').config();

// ============================================
// 2. VALIDAR CONFIGURACIÓN (FAIL-FAST)
// ============================================
// ⚠️ IMPORTANTE: Esto valida ANTES de importar cualquier cosa
// Si falta alguna variable crítica, el proceso termina aquí
const { 
  server, 
  notifications 
} = require('../shared/constants');

// ============================================
// 3. IMPORTS (solo después de validar config)
// ============================================
const express = require('express');
const db = require('../shared/models');
const redisClient = require('../shared/utils/redis.util');
const { logger } = require('../shared/utils/logger.util');
const NotificationWorker = require('../workers/notificationWorker');
const notificationEmitter = require('../shared/utils/notificationEmitter.util');

// Importar las apps de cada módulo (ya incluyen su propio Swagger)
const clientApp = require('../modules/client/app');
const adminApp = require('../modules/admin/app');

class MonolithServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.setupRoutes();
  }

  setupRoutes() {
    // Health check global (sin autenticación)
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: server.nodeEnv, // ✅ Desde constants
        services: {
          client: 'running',
          admin: 'running',
          redis: redisClient.isAvailable() ? 'connected' : 'disconnected'
        }
      });
    });

    // Root route
    this.app.get('/', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to Democracia Líquida API - Monolith Mode',
        version: '1.0.0',
        mode: 'monolith',
        environment: server.nodeEnv, // ✅ Desde constants
        endpoints: {
          client: '/client',
          admin: '/admin',
          health: '/health'
        },
        documentation: {
          client: '/client/docs',
          admin: '/admin/docs'
        }
      });
    });

    // Montar las aplicaciones (cada una tiene su propio Swagger)
    this.app.use('/admin', adminApp);     // Admin en /admin/* + Swagger en /admin/docs
    this.app.use('/client', clientApp);   // Cliente en /client/* + Swagger en /client/docs

    // 404 handler global
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
        path: req.path
      });
    });
  }

  async start() {
    try {
      logger.info('=================================================');
      logger.info('🚀 STARTING MONOLITH SERVER');
      logger.info('=================================================');
      logger.info(`Environment: ${server.nodeEnv}`); // ✅ Desde constants
      logger.info(`Port: ${server.port}`);           // ✅ Desde constants
      logger.info(`Host: ${server.host}`);           // ✅ Desde constants
      logger.info('=================================================');

      // Connect to Redis
      logger.info('Connecting to Redis...');
      await redisClient.connect();

      if (redisClient.isAvailable()) {
        logger.info('✅ Redis connected');
      } else {
        logger.warn('⚠️  Running WITHOUT Redis (single-instance mode)');
      }

      // Initialize notification emitter
      await notificationEmitter.initialize();
      logger.info('✅ Notification emitter initialized');

      // Connect to Database
      logger.info('Connecting to database...');
      await db.sequelize.authenticate();
      logger.info('✅ Database connection established');

      // Start notification workers if enabled
      if (notifications.enableWorkers) { // ✅ Desde constants
        NotificationWorker.iniciar();
        logger.info('✅ Notification workers enabled');
      } else {
        logger.info('ℹ️  Notification workers disabled');
      }

      // Start HTTP server
      this.server = this.app.listen(server.port, server.host, () => {
        logger.info('=================================================');
        logger.info('🎉 MONOLITH SERVER RUNNING');
        logger.info('=================================================');
        logger.info(`🌐 Server: http://${server.host}:${server.port}`);
        logger.info(`📊 Environment: ${server.nodeEnv}`);
        logger.info(`❤️  Health: http://${server.host}:${server.port}/health`);
        logger.info(`👥 Client API: http://${server.host}:${server.port}/client`);
        logger.info(`🔐 Admin API: http://${server.host}:${server.port}/admin`);
        logger.info(`📚 Client Docs: http://${server.host}:${server.port}/client/docs`);
        logger.info(`📚 Admin Docs: http://${server.host}:${server.port}/admin/docs`);
        logger.info('=================================================');
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start monolith server', { 
        error: error.message, 
        stack: error.stack 
      });
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received, starting graceful shutdown...`);

      if (this.server) {
        this.server.close(async () => {
          logger.info('✅ HTTP server closed');

          try {
            // Close database connection
            await db.sequelize.close();
            logger.info('✅ Database connection closed');

            // Close Redis connection
            await redisClient.disconnect();
            logger.info('✅ Redis connection closed');

            logger.info('🎉 Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('❌ Error during graceful shutdown', { 
              error: error.message 
            });
            process.exit(1);
          }
        });

        // Force shutdown after timeout (10 seconds)
        setTimeout(() => {
          logger.error('❌ Forced shutdown due to timeout');
          process.exit(1);
        }, 10000);
      }
    };

    // Handle signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Global error handlers
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception DETECTED', {
        message: error?.message,
        stack: error?.stack,
      });
      // En producción, es mejor dejar que el proceso muera
      if (server.nodeEnv === 'production') {
        process.exit(1);
      }
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection DETECTED', {
        reason,
        promise,
        reasonMessage: reason?.message,
        reasonStack: reason?.stack,
      });
      // En producción, es mejor dejar que el proceso muera
      if (server.nodeEnv === 'production') {
        process.exit(1);
      }
    });
  }
}

// ============================================
// START SERVER
// ============================================
const monolithServer = new MonolithServer();
monolithServer.start();

module.exports = monolithServer;