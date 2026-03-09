'use strict';

const notificationRepo    = require('../../repositories/notification.repository');
const userPushTokenRepo   = require('../../repositories/user-push-token.repository');
const emailService        = require('./email-notification.service');
const pushService         = require('./push-notification.service');
const schedulerService    = require('./notification-scheduler.service');
const { logger }          = require('../../../../shared/utils/logger.util');

class NotificationSendingService {

  /**
   * Procesa envíos individuales (push y/o email) respetando preferencias y quiet hours
   * @param {string}  notificationId  - ID de la notificación
   * @param {string}  userId          - ID del usuario
   * @param {Object}  notificationType
   * @param {string}  title
   * @param {string}  body
   * @param {Object}  metadata
   * @param {Object}  userPreference  - Preferencias del usuario
   * @param {boolean} isQuietHours
   * @param {boolean} isHighPriority
   */
  async procesarEnviosIndividuales(
    notificationId,
    userId,
    notificationType,
    title,
    body,
    metadata,
    userPreference,
    isQuietHours,
    isHighPriority
  ) {
    try {
      // PUSH
      if (notificationType.supports_push) {
        const allowPush = userPreference?.allow_push ?? true;

        if (allowPush) {
          if (isQuietHours && !isHighPriority) {
            await schedulerService.programarEnvioPush(notificationId, userPreference);
          } else {
            await this.enviarPushIndividual(userId, title, body, metadata, notificationId);
          }
        }
      }

      // EMAIL
      if (notificationType.supports_email) {
        const allowEmail = userPreference?.allow_email ?? true;

        if (allowEmail) {
          if (isQuietHours && !isHighPriority) {
            await schedulerService.programarEnvioEmail(notificationId, userPreference);
          } else {
            await this.enviarEmailIndividual(userId, notificationType, metadata, notificationId);
          }
        }
      }

      await notificationRepo.updateProcessingStatus(notificationId, 'completed');

    } catch (error) {
      logger.error('Error en procesamiento individual', { error: error.message, notificationId });
      await notificationRepo.updateProcessingStatus(notificationId, 'failed');
    }
  }

  /**
   * Envía push individual con manejo de errores
   * @param {string} userId          - ID del usuario
   * @param {string} title
   * @param {string} body
   * @param {Object} metadata
   * @param {string} notificationId
   */
  async enviarPushIndividual(userId, title, body, metadata, notificationId) {
    try {
      const tokens = await userPushTokenRepo.findActiveByUser(userId);

      if (tokens.length === 0) {
        logger.warn('Usuario sin tokens push activos', { userId });
        return;
      }

      const promises = tokens.map(tokenData =>
        pushService.enviarPushIndividual(tokenData.token, title, body, metadata)
          .catch(err => {
            logger.error('Error enviando a token específico', {
              error: err.message,
              token: tokenData.token.substring(0, 20) + '...',
            });
            return { success: false, error: err.message };
          })
      );

      const results      = await Promise.allSettled(promises);
      const successCount = results.filter(
        r => r.status === 'fulfilled' && r.value && r.value.success !== false
      ).length;

      if (successCount > 0) {
        await notificationRepo.markPushSent(notificationId);
        logger.info('Push individual enviado', { userId, successCount, totalTokens: tokens.length });
      } else {
        await notificationRepo.recordPushError(notificationId, 'Todos los envíos fallaron');
      }

    } catch (error) {
      logger.error('Error al enviar push individual', { error: error.message, userId });
      await notificationRepo.recordPushError(notificationId, error.message);
    }
  }

  /**
   * Envía email individual con manejo de errores
   * @param {string} userId          - ID del usuario
   * @param {Object} notificationType
   * @param {Object} metadata
   * @param {string} notificationId
   */
  async enviarEmailIndividual(userId, notificationType, metadata, notificationId) {
    try {
      let email;

      if (metadata.email) {
        email = metadata.email;
      } else {
        const userRepo = require('../../../kyc/repositories/user.repository');

        const user = await userRepo.findById(userId, {
          include: [
            {
              association: 'person',
              include: [{ association: 'contact' }],
            },
          ],
        });

        if (!user || !user.person?.contact?.email) {
          logger.warn('Usuario sin email', { userId });
          return;
        }

        email = user.person.contact.email;
      }

      await emailService.enviarNotificacion(email, notificationType, metadata);
      await notificationRepo.markEmailSent(notificationId);

      logger.info('Email individual enviado', { userId, email });

    } catch (error) {
      logger.error('Error al enviar email individual', { error: error.message, userId });
      await notificationRepo.recordEmailError(notificationId, error.message);
    }
  }

  /**
   * Procesa una notificación programada (llamado por el scheduler)
   * @param {Object} notification - Notificación de BD
   */
  async procesarNotificacionProgramada(notification) {
    try {
      await notificationRepo.updateProcessingStatus(notification.notification_id, 'processing');

      const notificationTypeRepo = require('../repositories/notificationType.repository');
      const notificationType     = await notificationTypeRepo.findById(
        notification.notification_type_id
      );

      if (!notificationType) {
        logger.error('Tipo de notificación no encontrado', {
          notification_type_id: notification.notification_type_id,
        });
        return;
      }

      const metadata = notification.metadata || {};

      // Push
      if (notificationType.supports_push && !notification.push_sent) {
        await this.enviarPushIndividual(
          notification.user_id,
          notification.title,
          notification.body,
          metadata,
          notification.notification_id
        );
      }

      // Email
      if (notificationType.supports_email && !notification.email_sent) {
        await this.enviarEmailIndividual(
          notification.user_id,
          notificationType,
          metadata,
          notification.notification_id
        );
      }

      await notificationRepo.updateProcessingStatus(notification.notification_id, 'completed');

    } catch (error) {
      logger.error('Error procesando notificación programada', {
        error:           error.message,
        notification_id: notification.notification_id,
      });
      await notificationRepo.updateProcessingStatus(notification.notification_id, 'failed');
    }
  }
}

module.exports = new NotificationSendingService();