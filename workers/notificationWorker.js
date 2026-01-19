'use strict';

const cron = require('node-cron');
const NotificationUtil = require('../shared/utils/notification.util');
const { logger } = require('../shared/utils/logger.util');

class NotificationWorker {
  
  /**
   * Inicia todos los workers de notificaciones
   */
  static iniciar() {
    // Procesar notificaciones programadas cada 5 minutos
    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Ejecutando worker: procesar notificaciones programadas');
        await NotificationUtil.procesarNotificacionesProgramadas();
      } catch (error) {
        logger.error('Error en worker de notificaciones programadas', { 
          error: error.message 
        });
      }
    });

    // Reintentar push fallidos cada 10 minutos
    cron.schedule('*/10 * * * *', async () => {
      try {
        logger.info('Ejecutando worker: reintentar push fallidos');
        await NotificationUtil.reintentarEnviosPush();
      } catch (error) {
        logger.error('Error en worker de reintentos push', { 
          error: error.message 
        });
      }
    });

    // Reintentar emails fallidos cada 15 minutos
    cron.schedule('*/15 * * * *', async () => {
      try {
        logger.info('Ejecutando worker: reintentar emails fallidos');
        await NotificationUtil.reintentarEnviosEmail();
      } catch (error) {
        logger.error('Error en worker de reintentos email', { 
          error: error.message 
        });
      }
    });

    // Limpieza de notificaciones antiguas - diario a las 3 AM
    cron.schedule('0 3 * * *', async () => {
      try {
        logger.info('Ejecutando worker: limpieza de notificaciones antiguas');
        await NotificationUtil.limpiarNotificacionesAntiguas();
      } catch (error) {
        logger.error('Error en worker de limpieza', { 
          error: error.message 
        });
      }
    });

    logger.info('Workers de notificaciones iniciados exitosamente');
  }
}

module.exports = NotificationWorker;