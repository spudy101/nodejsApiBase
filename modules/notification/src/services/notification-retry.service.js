'use strict';

const notificationRepo          = require('../../repositories/notification.repository');
const notificationSendingService = require('./notification-sending.service');
const { logger }                = require('../../../../shared/utils/logger.util');

class NotificationRetryService {

  /**
   * Reintentar envíos fallidos de push
   */
  async reintentarEnviosPush() {
    try {
      const pending = await notificationRepo.findPendingPushRetries();

      logger.info('Reintentando envíos de push pendientes', { count: pending.length });

      for (const notification of pending) {
        await notificationSendingService.enviarPushIndividual(
          notification.user_id,
          notification.title,
          notification.body,
          notification.metadata || {},
          notification.notification_id
        );
      }

      logger.info('Reintentos de push completados', { count: pending.length });

      return pending.length;
    } catch (error) {
      logger.error('Error al reintentar push', { error: error.message });
      throw error;
    }
  }

  /**
   * Reintentar envíos fallidos de email
   */
  async reintentarEnviosEmail() {
    try {
      const pending = await notificationRepo.findPendingEmailRetries();

      logger.info('Reintentando envíos de email pendientes', { count: pending.length });

      for (const notification of pending) {
        const notificationTypeRepo = require('../repositories/notificationType.repository');
        const notificationType     = await notificationTypeRepo.findById(
          notification.notification_type_id
        );

        if (notificationType) {
          await notificationSendingService.enviarEmailIndividual(
            notification.user_id,
            notificationType,
            notification.metadata || {},
            notification.notification_id
          );
        }
      }

      logger.info('Reintentos de email completados', { count: pending.length });

      return pending.length;
    } catch (error) {
      logger.error('Error al reintentar email', { error: error.message });
      throw error;
    }
  }
}

module.exports = new NotificationRetryService();