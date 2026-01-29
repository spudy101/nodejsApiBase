'use strict';

const notificationRepo = require('../../infrastructure/database/repositories/notification.repository');
const notificationTypeRepo = require('../../infrastructure/database/repositories/notificationType.repository');
const userNotificationPreferenceRepo = require('../../infrastructure/database/repositories/userNotificationPreference.repository');
const globalNotificationRepo = require('../../infrastructure/database/repositories/globalNotification.repository');
const notificationTemplateService = require('./notificationTemplate.service');
const notificationDeliveryService = require('./notificationDelivery.service');
const globalNotificationService = require('./globalNotification.service');
const notificationSchedulerService = require('./notificationScheduler.service');
const PriorityMapper = require('../../utils/priorityMapper.util');
const QuietHoursUtil = require('../../utils/quietHours.util');
const sesClient = require('../../infrastructure/external/ses.client');
const notificationEmitter = require('../../utils/notificationEmitter.util');
const { logger } = require('@abundbank/shared');
const AppError = require('@abundbank/shared');

/**
 * Servicio principal de notificaciones (Orquestador)
 * Responsabilidad: Punto de entrada, decisiones de alto nivel, orquestación
 */
class NotificationService {
  /**
   * Crea y envía una notificación directa por email sin guardarla en BD
   * @param {Object} data
   * @param {string} data.tipo_notificacion - Código del tipo de notificación
   * @param {string} data.email - Email del destinatario
   * @param {Object} data.metadata - Datos para templates
   * @returns {Promise<{estado_solicitud: number, message: string}>}
   */
  async crearNotificacionDirecta(data) {
    try {
      const { tipo_notificacion, email, metadata = {} } = data;

      // Validaciones
      if (!tipo_notificacion) {
        throw AppError.badRequest('tipo_notificacion es requerido');
      }

      if (!email) {
        throw AppError.badRequest('email es requerido');
      }

      // Obtener tipo de notificación
      const notificationType = await notificationTypeRepo.findByCode(tipo_notificacion);
      if (!notificationType) {
        throw AppError.notFound(`Tipo de notificación no encontrado: ${tipo_notificacion}`);
      }

      // Validar que soporte email
      if (!notificationType.supports_email) {
        throw AppError.badRequest('Este tipo de notificación no soporta email');
      }

      // Generar contenido
      const content = notificationTemplateService.generateContent(notificationType, metadata);

      // Enviar email directamente
      await sesClient.enviarEmail(email, content.emailSubject, content.emailBody);

      logger.info('Notificación directa enviada', {
        tipo: tipo_notificacion,
        email
      });

      return {
        estado_solicitud: 1,
        message: 'Notificación enviada exitosamente por email.'
      };
    } catch (error) {
      logger.error('Error enviando notificación directa', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Crea y envía una notificación (individual o global)
   * @param {Object} data
   * @param {string} data.tipo_notificacion - Código del tipo de notificación
   * @param {string|null} data.person_id - ID de la persona (null para globales)
   * @param {Object} data.related_entity - Entidad relacionada { type, id }
   * @param {Object} data.metadata - Datos para templates
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<Object>}
   */
  async crearNotificacion(data, transaction = null) {
    try {
      const {
        tipo_notificacion,
        person_id = null,
        related_entity = {},
        metadata = {},
      } = data;

      // Validar tipo de notificación
      if (!tipo_notificacion) {
        throw AppError.badRequest('tipo_notificacion es requerido');
      }

      // Obtener tipo de notificación
      const notificationType = await notificationTypeRepo.findByCode(tipo_notificacion);
      if (!notificationType) {
        throw AppError.notFound(`Tipo de notificación no encontrado: ${tipo_notificacion}`);
      }

      // Generar contenido desde templates
      const content = notificationTemplateService.generateContent(notificationType, metadata);

      // Decidir entre individual o global
      let result;
      if (person_id) {
        result = await this._crearNotificacionIndividual(
          person_id,
          notificationType,
          content,
          related_entity,
          metadata,
          transaction
        );
      } else {
        result = await this._crearNotificacionGlobal(
          notificationType,
          content,
          metadata,
          transaction
        );
      }

      logger.info('Notificación creada exitosamente', {
        notification_id: result.notification_id || result.global_notification_id,
        tipo: tipo_notificacion,
        person_id,
        is_global: !person_id
      });

      // Emitir evento SSE si es individual
      if (person_id) {
        try {
          const personalCount = await notificationRepo.countUnreadByPerson(person_id);
          const globalUnread = await globalNotificationRepo.findUnreadByPerson(person_id);
          const newCount = personalCount + globalUnread.length;

          notificationEmitter.emit('count-updated', {
            userId: person_id,
            count: newCount
          });

          logger.debug('SSE event emitted', { person_id, count: newCount });
        } catch (sseError) {
          logger.error('Error emitiendo SSE event', {
            person_id,
            error: sseError.message
          });
        }
      }

      return {
        estado_solicitud: 1,
        message: 'Notificación creada exitosamente.',
        ...result
      };
    } catch (error) {
      logger.error('Error creando notificación', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * MÉTODO PRIVADO: Crea notificación individual
   */
  async _crearNotificacionIndividual(personId, notificationType, content, related_entity, metadata, transaction) {
    // 1. Crear notificación in-app
    const notification = await notificationRepo.create({
      person_id: personId,
      notification_type_id: notificationType.id,
      title: content.title,
      body: content.body,
      related_entity_type: related_entity?.type || null,
      related_entity_id: related_entity?.id || null,
      metadata,
      processing_status: 'pending',
      priority: PriorityMapper.toNumber(notificationType.priority)
    }, { transaction });

    // 2. Obtener preferencias del usuario
    const userPreference = await userNotificationPreferenceRepo.findByPersonAndType(
      personId,
      notificationType.code
    );

    // 3. Verificar quiet hours y prioridad
    const isQuietHours = QuietHoursUtil.isInQuietHours(userPreference);
    const isHighPriority = PriorityMapper.isHigh(notificationType.priority);

    // 4. Programar envíos en background
    setImmediate(() => {
      this._procesarEnviosIndividuales(
        notification.id,
        personId,
        notificationType,
        content,
        metadata,
        userPreference,
        isQuietHours,
        isHighPriority
      ).catch(err => {
        logger.error('Error procesando envíos individuales', {
          error: err.message,
          notification_id: notification.id
        });
      });
    });

    return { notification_id: notification.id };
  }

  /**
   * MÉTODO PRIVADO: Crea notificación global
   */
  async _crearNotificacionGlobal(notificationType, content, metadata, transaction) {
    return await globalNotificationService.crearYProgramar(
      notificationType,
      content.title,
      content.body,
      metadata,
      transaction
    );
  }

  /**
   * MÉTODO PRIVADO: Procesa envíos individuales
   */
  async _procesarEnviosIndividuales(notificationId, personId, notificationType, content, metadata, userPreference, isQuietHours, isHighPriority) {
    try {
      // PUSH
      if (notificationType.supports_push) {
        const allowPush = userPreference?.allow_push ?? true;

        if (allowPush) {
          if (isQuietHours && !isHighPriority) {
            await notificationSchedulerService.programarEnvioPush(
              notificationId,
              userPreference
            );
          } else {
            await notificationDeliveryService.enviarPushAPerson(
              personId,
              content.title,
              content.body,
              metadata,
              notificationId
            );
          }
        }
      }

      // EMAIL
      if (notificationType.supports_email) {
        const allowEmail = userPreference?.allow_email ?? true;

        if (allowEmail) {
          if (isQuietHours && !isHighPriority) {
            await notificationSchedulerService.programarEnvioEmail(
              notificationId,
              userPreference
            );
          } else {
            await notificationDeliveryService.enviarEmailAPerson(
              personId,
              notificationType,
              metadata,
              notificationId,
              metadata.email
            );
          }
        }
      }

      await notificationRepo.updateProcessingStatus(notificationId, 'completed');
    } catch (error) {
      logger.error('Error en procesamiento individual', {
        error: error.message,
        notificationId
      });
      await notificationRepo.updateProcessingStatus(notificationId, 'failed');
    }
  }
}

module.exports = new NotificationService();
