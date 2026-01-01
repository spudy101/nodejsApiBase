// server.js
require('dotenv').config();
const app = require('./app');
const db = require('./models');
const redisClient = require('./utils/redis');
const { logger } = require('./utils/logger');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

class Server {
  constructor() {
    this.server = null;
  }

  async start() {
    try {
      // Connect to Redis
      logger.info('Connecting to Redis...');
      
      // 🆕 Intentar conectar Redis (opcional)
      await redisClient.connect();

      if (redisClient.isAvailable()) {
        logger.info('🚀 Server starting WITH Redis');
      } else {
        logger.warn('🚀 Server starting WITHOUT Redis (single-instance mode)');
      }

      // Connect to Database
      logger.info('Connecting to database...');
      await db.sequelize.authenticate();
      logger.info('Database connection established successfully');

      // Sync database (only in development)
      if (process.env.NODE_ENV === 'development') {
        logger.info('Syncing database...');
        await db.sequelize.sync({ alter: true });
        logger.info('Database synced successfully');
      }

      // Start server
      this.server = app.listen(PORT, HOST, () => {
        logger.info(`Server running on http://${HOST}:${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        logger.info(`Health check: http://${HOST}:${PORT}/api/health`);
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('Failed to start server', { error: error.message, stack: error.stack });
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

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      gracefulShutdown('unhandledRejection');
    });
  }
}

// Start server
const server = new Server();
server.start();

module.exports = server;