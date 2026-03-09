// servers/client.js

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
  workers 
} = require('../shared/constants');

// ============================================
// 3. IMPORTS (solo después de validar config)
// ============================================
const db = require('../shared/models');
const redisClient = require('../shared/utils/redis.util');
const { logger } = require('../shared/utils/logger.util');
const NotificationWorker = require('../workers/notificationWorker');
const notificationEmitter = require('../shared/utils/notificationEmitter.util');

// Importar la app del cliente (ya incluye su propio Swagger)
const clientApp = require('../modules/client/app');

class ClientServer {
  constructor() {
    this.server = null;
  }

  async start() {
    try {
      logger.info('=================================================');
      logger.info('🚀 STARTING CLIENT SERVER');
      logger.info('=================================================');
      logger.info(`Environment: ${server.nodeEnv}`); // ✅ Desde constants
      logger.info(`Port: ${server.clientPort}`);     // ✅ Desde constants
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
      if (workers.enabled) {
        NotificationWorker.iniciar();
        KycValidationWorker.iniciar();
        logger.info('✅ workers enabled');
      } else {
        logger.info('ℹ️ workers disabled');
      }

      // Start HTTP server
      this.server = clientApp.listen(server.clientPort, server.host, () => {
        logger.info('=================================================');
        logger.info('🎉 CLIENT SERVER RUNNING');
        logger.info('=================================================');
        logger.info(`🌐 Server: http://${server.host}:${server.clientPort}`);
        logger.info(`📊 Environment: ${server.nodeEnv}`);
        logger.info(`❤️  Health: http://${server.host}:${server.clientPort}/health`);
        logger.info(`📚 API Docs: http://${server.host}:${server.clientPort}/docs`);
        logger.info('=================================================');
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start client server', { 
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
const clientServer = new ClientServer();
clientServer.start();

module.exports = clientServer;