require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Iniciar servidor
const startServer = async () => {
  try {
    // Verificar conexión a la base de datos
    await sequelize.authenticate();
    logger.info('✅ Conexión a base de datos exitosa', {
      database: process.env.DB_NAME,
      host: process.env.DB_HOST
    });

    // Iniciar servidor HTTP
    const server = app.listen(PORT, () => {
      logger.info('🚀 Servidor iniciado', {
        port: PORT,
        environment: NODE_ENV,
        apiPrefix: process.env.API_PREFIX || '/api/v1'
      });

      console.log('\n========================================');
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📊 Ambiente: ${NODE_ENV}`);
      console.log(`🔗 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}/health`);
      console.log('========================================\n');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`${signal} recibido, cerrando servidor...`);
      
      server.close(async () => {
        logger.info('Servidor HTTP cerrado');
        
        try {
          await sequelize.close();
          logger.info('Conexión a BD cerrada');
          process.exit(0);
        } catch (error) {
          logger.error('Error al cerrar conexión a BD', { error: error.message });
          process.exit(1);
        }
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error('Forzando cierre del servidor...');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('❌ Error al iniciar servidor', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Iniciar
startServer();