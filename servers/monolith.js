// servers/monolith.js
require('dotenv').config();
const express = require('express');
const db = require('../shared/models');
const redisClient = require('../shared/utils/redis.util');
const { logger } = require('../shared/utils/logger.util');
const NotificationWorker = require('../workers/notificationWorker');
const notificationEmitter = require('../shared/utils/notificationEmitter.util');

// Importar las apps de cada módulo (ya incluyen su propio Swagger)
const clientApp = require('../modules/client/app');
const adminApp = require('../modules/admin/app');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

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
        services: {
          client: 'running',
          admin: 'running'
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
      // Connect to Redis
      logger.info('Connecting to Redis...');
      await redisClient.connect();

      if (redisClient.isAvailable()) {
        logger.info('🚀 Monolith server starting WITH Redis');
      } else {
        logger.warn('🚀 Monolith server starting WITHOUT Redis (single-instance mode)');
      }

      await notificationEmitter.initialize();

      // Connect to Database
      logger.info('Connecting to database...');
      await db.sequelize.authenticate();
      logger.info('Database connection established successfully');

      // Start server
      this.server = this.app.listen(PORT, HOST, () => {
        logger.info(`=================================================`);
        logger.info(`🚀 MONOLITH SERVER RUNNING`);
        logger.info(`=================================================`);
        logger.info(`Server: http://${HOST}:${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Health check: http://${HOST}:${PORT}/health`);
        logger.info(`Client API: http://${HOST}:${PORT}/client`);
        logger.info(`Admin API: http://${HOST}:${PORT}/admin`);
        logger.info(`📚 Client Docs: http://${HOST}:${PORT}/client/docs`);
        logger.info(`📚 Admin Docs: http://${HOST}:${PORT}/admin/docs`);
        logger.info(`=================================================`);
      });

      // Start notification workers if enabled
      if (process.env.ENABLE_NOTIFICATION_WORKERS === 'true') {
        NotificationWorker.iniciar();
        logger.info('Notification workers enabled');
      }

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start monolith server', { 
        error: error.message, 
        stack: error.stack 
      });
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      if (this.server) {
        this.server.close(async () => {
          logger.info('HTTP server closed');

          try {
            // Close database connection
            await db.sequelize.close();
            logger.info('Database connection closed');

            // Close Redis connection
            await redisClient.disconnect();
            logger.info('Redis connection closed');

            logger.info('Graceful shutdown completed');
            process.exit(0);
          } catch (error) {
            logger.error('Error during graceful shutdown', { error: error.message });
            process.exit(1);
          }
        });

        // Force shutdown after timeout
        setTimeout(() => {
          logger.error('Forced shutdown due to timeout');
          process.exit(1);
        }, 10000);
      }
    };

    // Handle signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception DETECTED', {
        message: error?.message,
        stack: error?.stack,
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection DETECTED', {
        reason,
        promise,
        reasonMessage: reason?.message,
        reasonStack: reason?.stack,
      });
    });
  }
}

// Start monolith server
const server = new MonolithServer();
server.start();

module.exports = server;