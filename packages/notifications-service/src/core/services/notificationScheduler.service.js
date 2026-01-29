'use strict';

const notificationRepo = require('../../infrastructure/database/repositories/notification.repository');
const notificationTypeRepo = require('../../infrastructure/database/repositories/notificationType.repository');
const userPushTokenRepo = require('../../infrastructure/database/repositories/userPushToken.repository');
const notificationDeliveryService = require('./notificationDelivery.service');
const QuietHoursUtil = require('../../utils/quietHours.util');
const { logger } = require('@abundbank/shared');

/**
 * Servicio para programación y reintentos de notificaciones
 * Responsabilidad: Manejar quiet hours, reintentos, limpieza
 */
class NotificationSchedulerService {
  /**
   * Programa un envío de push para después de quiet hours
   * @param {string} notificationId
   * @param {Object} userPreference
   */
  async programarEnvioPush(notificationId, userPreference) {
    const nextRetryAt = QuietHoursUtil.calcularFinQuietHours(userPreference);

    await notificationRepo.update(notificationId, {
      scheduled_for: nextRetryAt,
      push_next_retry_at: nextRetryAt
    });

    logger.info('Push programado para después de quiet hours', {
      notificationId,
      nextRetryAt
    });
  }

  /**
   * Programa un envío de email para después de quiet hours
   * @param {string} notificationId
   * @param {Object} userPreference
   */
  async programarEnvioEmail(notificationId, userPreference) {
    const nextRetryAt = QuietHoursUtil.calcularFinQuietHours(userPreference);

    await notificationRepo.update(notificationId, {
      scheduled_for: nextRetryAt,
      email_next_retry_at: nextRetryAt
    });

    logger.info('Email programado para después de quiet hours', {
      notificationId,
      nextRetryAt
    });
  }

  /**
   * Procesa notificaciones programadas (ejecutar en cron)
   * @returns {Promise<{processed: number}>}
   */
  async procesarProgramadas() {
    try {
      const scheduled = await notificationRepo.findScheduledReady();

      logger.info('Procesando notificaciones programadas', { 
        count: scheduled.length 
      });

      let processedCount = 0;

      for (const notification of scheduled) {
        await notificationRepo.updateProcessingStatus(
          notification.id,
          'processing'
        );

        const notificationType = await notificationTypeRepo.findById(
          notification.notification_type_id
        );

        if (notificationType) {
          const metadata = notification.metadata || {};

          // Push
          if (notificationType.supports_push && !notification.push_sent) {
            await notificationDeliveryService.enviarPushAPerson(
              notification.person_id,
              notification.title,
              notification.body,
              metadata,
              notification.id
            );
          }

          // Email
          if (notificationType.supports_email && !notification.email_sent) {
            await notificationDeliveryService.enviarEmailAPerson(
              notification.person_id,
              notificationType,
              metadata,
              notification.id
            );
          }
        }

        await notificationRepo.updateProcessingStatus(
          notification.id,
          'completed'
        );

        processedCount++;
      }

      logger.info('Notificaciones programadas procesadas', { 
        count: processedCount 
      });

      return { processed: processedCount };
    } catch (error) {
      logger.error('Error procesando notificaciones programadas', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Reintentar envíos fallidos de push (ejecutar en cron)
   * @returns {Promise<{retried: number}>}
   */
  async reintentarPush() {
    try {
      const pending = await notificationRepo.findPendingPushRetries();

      logger.info('Reintentando envíos de push pendientes', { 
        count: pending.length 
      });

      let retriedCount = 0;

      for (const notification of pending) {
        await notificationDeliveryService.enviarPushAPerson(
          notification.person_id,
          notification.title,
          notification.body,
          notification.metadata || {},
          notification.id
        );
        retriedCount++;
      }

      logger.info('Reintentos de push completados', { 
        count: retriedCount 
      });

      return { retried: retriedCount };
    } catch (error) {
      logger.error('Error al reintentar push', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Reintentar envíos fallidos de email (ejecutar en cron)
   * @returns {Promise<{retried: number}>}
   */
  async reintentarEmail() {
    try {
      const pending = await notificationRepo.findPendingEmailRetries();

      logger.info('Reintentando envíos de email pendientes', { 
        count: pending.length 
      });

      let retriedCount = 0;

      for (const notification of pending) {
        const notificationType = await notificationTypeRepo.findById(
          notification.notification_type_id
        );

        if (notificationType) {
          await notificationDeliveryService.enviarEmailAPerson(
            notification.person_id,
            notificationType,
            notification.metadata || {},
            notification.id
          );
          retriedCount++;
        }
      }

      logger.info('Reintentos de email completados', { 
        count: retriedCount 
      });

      return { retried: retriedCount };
    } catch (error) {
      logger.error('Error al reintentar email', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Limpieza de notificaciones antiguas (ejecutar en cron diario)
   * @returns {Promise<{notifications: number, tokens: number}>}
   */
  async limpiarAntiguas() {
    try {
      const deletedNotifications = await notificationRepo.deleteOldRead(90);
      const deletedTokens = await userPushTokenRepo.deleteOldInactive(90);

      logger.info('Limpieza completada', {
        notificaciones_eliminadas: deletedNotifications,
        tokens_eliminados: deletedTokens
      });

      return {
        notifications: deletedNotifications,
        tokens: deletedTokens
      };
    } catch (error) {
      logger.error('Error en limpieza', { error: error.message });
      throw error;
    }
  }
}

module.exports = new NotificationSchedulerService();
