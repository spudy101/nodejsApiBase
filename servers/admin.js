// servers/admin.js
require('dotenv').config();
const db = require('../shared/models');
const redisClient = require('../shared/utils/redis.util');
const { logger } = require('../shared/utils/logger.util');

// Importar la app del admin
const adminApp = require('../modules/admin/app');

const PORT = process.env.ADMIN_PORT || process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

class AdminServer {
  constructor() {
    this.server = null;
  }

  async start() {
    try {
      // Connect to Redis
      logger.info('Connecting to Redis...');
      await redisClient.connect();

      if (redisClient.isAvailable()) {
        logger.info('🚀 Admin server starting WITH Redis');
      } else {
        logger.warn('🚀 Admin server starting WITHOUT Redis (single-instance mode)');
      }

      // Connect to Database
      logger.info('Connecting to database...');
      await db.sequelize.authenticate();
      logger.info('Database connection established successfully');

      // Add health check route to the app before starting
      adminApp.get('/health', async (req, res) => {
        const healthCheck = {
          success: true,
          status: 'healthy',
          service: 'admin',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: process.env.NODE_ENV || 'development',
          services: {
            database: 'unknown',
            redis: 'unknown'
          }
        };

        // Check Redis
        healthCheck.services.redis = redisClient.isAvailable() ? 'connected' : 'disconnected';

        // Check Database
        try {
          await db.sequelize.authenticate();
          healthCheck.services.database = 'connected';
        } catch (error) {
          healthCheck.services.database = 'disconnected';
          healthCheck.status = 'degraded';
          healthCheck.success = false;
        }

        // 🔥 Retorna 503 si algún servicio crítico falla
        const statusCode = healthCheck.success ? 200 : 503;
        res.status(statusCode).json(healthCheck);
      });

      // Start server
      this.server = adminApp.listen(PORT, HOST, () => {
        logger.info(`=================================================`);
        logger.info(`🚀 ADMIN SERVER RUNNING`);
        logger.info(`=================================================`);
        logger.info(`Server: http://${HOST}:${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Health check: http://${HOST}:${PORT}/health`);
        logger.info(`API Base: http://${HOST}:${PORT}`);
        logger.info(`=================================================`);
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start admin server', { 
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

// Start admin server
const server = new AdminServer();
server.start();

module.exports = server;