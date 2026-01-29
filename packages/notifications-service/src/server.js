// packages/kyc-service/src/server.js

/**
 * KYC Service - Server Entry Point
 * 
 * Responsabilidades:
 * 1. Cargar variables de entorno
 * 2. Validar configuración
 * 3. 🎯 INICIALIZAR TODOS LOS UTILS Y MIDDLEWARES (centralizado aquí)
 * 4. Conectar a BD (schema 'kyc')
 * 5. Conectar a Redis
 * 6. Iniciar servidor HTTP
 * 7. Manejar graceful shutdown
 */

// ============================================
// 1. CARGAR .ENV PRIMERO
// ============================================
require('dotenv').config();

// ============================================
// 2. VALIDAR CONFIGURACIÓN (FAIL-FAST)
// ============================================
const config = require('./config');

// ============================================
// 3. 🎯 INICIALIZAR TODOS LOS UTILS COMPARTIDOS
//    (Una sola vez aquí, disponibles en toda la app)
// ============================================

console.log('=================================================');
console.log('🔧 INITIALIZING SHARED UTILITIES');
console.log('=================================================');

// Importar TODO de shared
const {
  logger,
  encryptionUtil,
  cognitoUtil,
  s3Util,
  sanitizeUtil,
  AuthMiddleware,
  ErrorMiddleware,
  SecurityMiddleware,
  redisClient
} = require('@abundbank/shared');

// 3.1 Logger (PRIMERO - otros utils lo usan)
logger.initialize(config.logging, config.server);
logger.info('✅ Logger initialized');

// 3.2 Encryption
encryptionUtil.initialize(config.encryption);
logger.info('✅ EncryptionUtil initialized');

// 3.3 Cognito (solo si el servicio lo usa)
cognitoUtil.initialize(config.aws, config.cognito);
logger.info('✅ CognitoUtil initialized');

// 3.4 S3 (solo si el servicio lo usa)
s3Util.initialize(config.aws);
logger.info('✅ S3Util initialized');

// 3.5 Sanitize Audit Body
sanitizeUtil.initialize(config.server);
logger.info('✅ SanitizeAuditBodyUtil initialized');

// 3.6 Auth Middleware
AuthMiddleware.initialize(config);
logger.info('✅ AuthMiddleware initialized');

// 3.7 Error Middleware
ErrorMiddleware.initialize(config);
logger.info('✅ ErrorMiddleware initialized');

// 3.8 Security Middleware
SecurityMiddleware.initialize(config);
logger.info('✅ SecurityMiddleware initialized');

logger.info('=================================================');
logger.info('✅ ALL UTILITIES INITIALIZED');
logger.info('=================================================');
logger.info('');
logger.info('ℹ️  Ahora todos los archivos pueden usar estos utils sin inicializar:');
logger.info('   - logger, encryptionUtil, cognitoUtil, s3Util');
logger.info('   - AuthMiddleware, ErrorMiddleware, SecurityMiddleware');
logger.info('');

// ============================================
// 4. AHORA SÍ, IMPORTS DE LA APP
//    (app.js y todos los demás pueden usar los utils ya inicializados)
// ============================================
const app = require('./app');
const db = require('./infrastructure/database');

class KycServer {
  constructor() {
    this.server = null;
    this.port = config.server.port;
    this.host = config.server.host;
  }

  async start() {
    try {
      logger.info('=================================================');
      logger.info('🚀 STARTING KYC SERVICE');
      logger.info('=================================================');
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`Port: ${this.port}`);
      logger.info(`Host: ${this.host}`);
      logger.info(`Database: ${config.database.name}`);
      logger.info('=================================================');

      // Connect to Redis
      logger.info('Connecting to Redis...');
      await redisClient.connect(config.redis);

      if (redisClient.isAvailable()) {
        logger.info('✅ Redis connected');
      } else {
        logger.warn('⚠️  Running WITHOUT Redis (single-instance mode)');
      }

      // Connect to Database
      logger.info(`Connecting to database (${config.database.name})...`);
      await db.sequelize.authenticate();
      logger.info('✅ Database connection established');
      logger.info(`📊 Models loaded: ${Object.keys(db).filter(k => !k.startsWith('_') && k !== 'sequelize' && k !== 'Sequelize').length}`);

      // Start HTTP server
      this.server = app.listen(this.port, this.host, () => {
        logger.info('=================================================');
        logger.info('🎉 KYC SERVICE RUNNING');
        logger.info('=================================================');
        logger.info(`🌐 Server: http://${this.host}:${this.port}`);
        logger.info(`📊 Environment: ${config.server.nodeEnv}`);
        logger.info(`❤️  Health: http://${this.host}:${this.port}/health`);
        logger.info(`🗄️  Database: ${config.database.name}`);
        logger.info('=================================================');
      });

      // Handle graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start KYC service', { 
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
      if (config.server.nodeEnv === 'production') {
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
      if (config.server.nodeEnv === 'production') {
        process.exit(1);
      }
    });
  }
}

// ============================================
// START SERVER
// ============================================
const kycServer = new KycServer();
kycServer.start();

module.exports = kycServer;