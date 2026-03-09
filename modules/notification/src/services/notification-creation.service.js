'use strict';

const notificationRepo              = require('../../repositories/notification.repository');
const globalNotificationRepo        = require('../../repositories/global-notification.repository');
const notificationTypeRepo          = require('../../repositories/notification-type.repository');
const userNotificationPreferenceRepo = require('../../repositories/user-notification-preference.repository');
const notificationEmitter           = require('../utils/notification-emitter.util');
const notificationSchedulerService  = require('./notification-scheduler.service');
const notificationSendingService    = require('./notification-sending.service');
const NotificationContentUtil       = require('../utils/notification-content.util');
const { logger }                    = require('../../../../shared/utils/logger.util');
const AppError                      = require('../../../../shared/utils/app-error.util');

class NotificationCreationService {

  /**
   * Crea y envía una notificación directa por email sin guardarla en BD
   * Útil para cuentas eliminadas u otros casos donde el usuario ya no existe
   *
   * @param {Object} data
   * @param {string} data.tipo_notificacion
   * @param {string} data.email
   * @param {Object} [data.metadata]
   */
  async crearNotificacionDirecta(data) {
    try {
      const { tipo_notificacion, email, metadata = {} } = data;

      if (!tipo_notificacion) throw AppError.badRequest('tipo_notificacion es requerido');
      if (!email)             throw AppError.badRequest('email es requerido');

      const notificationType = await notificationTypeRepo.findByCode(tipo_notificacion);
      if (!notificationType) {
        throw AppError.notFound(`Tipo de notificación no encontrado: ${tipo_notificacion}`);
      }

      const emailService = require('./emailNotification.service');
      await emailService.enviarNotificacion(email, notificationType, metadata);

      logger.info('Notificación directa enviada exitosamente', { tipo: tipo_notificacion, email });

      return {
        estado_solicitud: 1,
        message:          'Notificación enviada exitosamente por email.',
      };
    } catch (error) {
      logger.error('Error al enviar notificación directa', {
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }

  /**
   * Crea y envía una notificación (individual o global)
   *
   * @param {Object}      data
   * @param {string}      data.tipo_notificacion
   * @param {string|null} data.user_id           - null → notificación global
   * @param {Object}      [data.related_entity]  - { type, id }
   * @param {Object}      [data.metadata]
   * @param {Object}      transaction            - Transacción de Sequelize
   */
  async crearNotificacion(data, transaction = null) {
    try {
      const {
        tipo_notificacion,
        user_id       = null,
        related_entity = {},
        metadata       = {},
      } = data;

      if (!tipo_notificacion) throw AppError.badRequest('tipo_notificacion es requerido');

      const notificationType = await notificationTypeRepo.findByCode(tipo_notificacion);
      if (!notificationType) {
        throw AppError.notFound(`Tipo de notificación no encontrado: ${tipo_notificacion}`);
      }

      // Generar contenido desde templates
      const generated = NotificationContentUtil.generarContenido(notificationType, metadata);

      let result;
      if (user_id) {
        result = await this._crearNotificacionIndividual(
          user_id, notificationType, generated.title, generated.body,
          related_entity, metadata, transaction
        );
      } else {
        result = await this._crearNotificacionGlobal(
          notificationType, generated.title, generated.body, metadata, transaction
        );
      }

      logger.info('Notificación creada exitosamente', {
        notification_id: result.notification_id || result.global_notification_id,
        tipo:            tipo_notificacion,
        user_id,
        is_global:       !user_id,
      });

      // Emitir evento SSE si es individual
      if (user_id) {
        await this._emitirActualizacionContador(user_id);
      }

      return {
        estado_solicitud: 1,
        message:          'Notificación creada exitosamente.',
        ...result,
      };
    } catch (error) {
      logger.error('Error al crear notificación', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  /** @private */
  async _crearNotificacionIndividual(userId, notificationType, title, body, related_entity, metadata, transaction) {
    // 1. Crear notificación in-app
    const notification = await notificationRepo.create({
      user_id:              userId,
      notification_type_id: notificationType.notification_type_id,
      title,
      body,
      related_entity_type:  related_entity?.type || null,
      related_entity_id:    related_entity?.id   || null,
      metadata,
      processing_status:    'pending',
      priority:             NotificationContentUtil.mapPriority(notificationType.priority),
    }, { transaction });

    // 2. Preferencias del usuario
    const userPreference = await userNotificationPreferenceRepo.findByUserAndType(
      userId,
      notificationType.code
    );

    // 3. Quiet hours y prioridad
    const isQuietHours  = notificationSchedulerService.isInQuietHours(userPreference);
    const isHighPriority = notificationType.priority === 'high';

    // 4. Programar envíos en background
    setImmediate(() => {
      notificationSendingService.procesarEnviosIndividuales(
        notification.notification_id,
        userId,
        notificationType,
        title,
        body,
        metadata,
        userPreference,
        isQuietHours,
        isHighPriority
      ).catch(err => {
        logger.error('Error procesando envíos individuales', {
          error:           err.message,
          notification_id: notification.notification_id,
        });
      });
    });

    return { notification_id: notification.notification_id };
  }

  /** @private */
  async _crearNotificacionGlobal(notificationType, title, body, metadata, transaction) {
    // 1. Crear notificación global
    const globalNotification = await globalNotificationRepo.create({
      notification_type_id: notificationType.notification_type_id,
      title,
      body,
      metadata,
      send_push:   notificationType.supports_push,
      send_email:  notificationType.supports_email,
      send_in_app: true,
      batch_size:  100,
      is_active:   true,
    }, { transaction });

    // 2. Programar procesamiento masivo en background
    const batchService = require('./notificationBatch.service');

    setImmediate(() => {
      batchService.procesarNotificacionGlobal(
        globalNotification.global_notification_id,
        notificationType,
        title,
        body,
        metadata
      ).catch(err => {
        logger.error('Error procesando notificación global', {
          error:                    err.message,
          global_notification_id:   globalNotification.global_notification_id,
        });
      });
    });

    return { global_notification_id: globalNotification.global_notification_id };
  }

  /** @private */
  async _emitirActualizacionContador(userId) {
    try {
      const personalCount = await notificationRepo.countUnreadByUser(userId);
      const globalUnread  = await globalNotificationRepo.findUnreadByUser(userId);
      const newCount      = personalCount + globalUnread.length;

      notificationEmitter.emit('count-updated', { userId, count: newCount });

      logger.debug('SSE event emitted', { userId, count: newCount });
    } catch (error) {
      logger.error('Error emitting SSE event', { userId, error: error.message });
    }
  }
}

module.exports = new NotificationCreationService();