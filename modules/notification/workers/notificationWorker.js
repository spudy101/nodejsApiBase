// notificationWorker.js
'use strict';

const cron = require('node-cron');
const notificationSchedulerService = require('../src/services/notification-scheduler.service');
const notificationSendingService = require('../src/services/notification-sending.service');
const notificationRetryService = require('../src/services/notification-retry.service');
const notificationCleanupService = require('../src/services/notification-cleanup.service');
const { logger } = require('../../../shared/utils/logger.util');

class NotificationWorker {
  
  /**
   * Inicia todos los workers de notificaciones
   */
  static iniciar() {
    
    // Procesar notificaciones programadas cada 5 minutos
    cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Ejecutando worker: procesar notificaciones programadas');
        
        const scheduled = await notificationSchedulerService.procesarNotificacionesProgramadas();
        
        for (const notification of scheduled) {
          await notificationSendingService.procesarNotificacionProgramada(notification);
        }
        
        logger.info('Notificaciones programadas procesadas', { 
          count: scheduled.length 
        });
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
        await notificationRetryService.reintentarEnviosPush();
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
        await notificationRetryService.reintentarEnviosEmail();
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
        await notificationCleanupService.limpiarNotificacionesAntiguas();
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