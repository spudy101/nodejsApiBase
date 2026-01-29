'use strict';

const globalNotificationRepo = require('../../infrastructure/database/repositories/globalNotification.repository');
const notificationDeliveryService = require('./notificationDelivery.service');
const SessionCacheUtil = require('@abundbank/shared');
const { logger } = require('@abundbank/shared');

/**
 * Servicio para notificaciones globales (masivas)
 * Responsabilidad: Crear y procesar notificaciones globales por lotes
 */
class GlobalNotificationService {
  /**
   * Crea una notificación global y programa su procesamiento
   * @param {Object} notificationType
   * @param {string} title
   * @param {string} body
   * @param {Object} metadata
   * @param {Object} transaction - Sequelize transaction
   * @returns {Promise<{global_notification_id: string}>}
   */
  async crearYProgramar(notificationType, title, body, metadata, transaction = null) {
    try {
      // Crear notificación global
      const globalNotification = await globalNotificationRepo.create({
        notification_type_id: notificationType.id,
        title,
        body,
        metadata,
        send_push: notificationType.supports_push,
        send_email: notificationType.supports_email,
        send_in_app: true,
        batch_size: 100,
        is_active: true
      }, { transaction });

      logger.info('Notificación global creada', {
        id: globalNotification.id,
        notificationType: notificationType.code
      });

      // Programar procesamiento en background
      setImmediate(() => {
        this.procesarPorLotes(
          globalNotification.id,
          notificationType,
          title,
          body,
          metadata
        ).catch(err => {
          logger.error('Error procesando notificación global', {
            error: err.message,
            id: globalNotification.id
          });
        });
      });

      return {
        global_notification_id: globalNotification.id
      };
    } catch (error) {
      logger.error('Error creando notificación global', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Procesa una notificación global por lotes
   * @param {string} globalNotificationId
   * @param {Object} notificationType
   * @param {string} title
   * @param {string} body
   * @param {Object} metadata
   */
  async procesarPorLotes(globalNotificationId, notificationType, title, body, metadata) {
    try {
      const cache = SessionCacheUtil.getCache();

      // Obtener usuarios elegibles (puedes filtrar por target_user_role, etc)
      const personRepository = require('../../../kyc/repositories/person.repository');

      // IMPORTANTE: Incluir contact para tener el email disponible
      const allPersons = await personRepository.findAll(
        { is_active: true },
        {
          include: [
            { association: 'contact' }, // Email disponible
            { association: 'user', include: [{ association: 'role' }] }
          ]
        }
      );

      const totalPersons = allPersons.length;

      // Actualizar totales
      await globalNotificationRepo.update(globalNotificationId, {
        total_target_users: totalPersons,
        processing_started_at: new Date()
      });

      // Guardar estado en Redis
      await cache.set(
        `global_notif:${globalNotificationId}:batch_state`,
        JSON.stringify({
          total_users: totalPersons,
          processed_users: 0,
          current_batch: 0,
          batch_size: 100,
          status: 'processing',
          started_at: new Date().toISOString()
        }),
        24 * 60 * 60 // TTL: 24 horas
      );

      // Procesar PUSH por lotes
      if (notificationType.supports_push) {
        await globalNotificationRepo.updatePushProcessingStatus(
          globalNotificationId,
          'processing'
        );

        const pushStats = await notificationDeliveryService.enviarPushMasivo(
          allPersons,
          title,
          body,
          metadata,
          notificationType.code,
          cache
        );

        await globalNotificationRepo.incrementPushSentCount(
          globalNotificationId,
          pushStats.success
        );

        await globalNotificationRepo.updatePushProcessingStatus(
          globalNotificationId,
          'completed'
        );
      }

      // Procesar EMAIL por lotes
      if (notificationType.supports_email) {
        await globalNotificationRepo.updateEmailProcessingStatus(
          globalNotificationId,
          'processing'
        );

        const emailStats = await notificationDeliveryService.enviarEmailMasivo(
          allPersons,
          notificationType,
          metadata,
          notificationType.code,
          cache
        );

        await globalNotificationRepo.incrementEmailSentCount(
          globalNotificationId,
          emailStats.success
        );

        await globalNotificationRepo.updateEmailProcessingStatus(
          globalNotificationId,
          'completed'
        );
      }

      // Actualizar completado
      await globalNotificationRepo.update(globalNotificationId, {
        processing_completed_at: new Date()
      });

      // Limpiar estado de Redis después de 1 hora
      setTimeout(async () => {
        await cache.del(`global_notif:${globalNotificationId}:batch_state`);
      }, 60 * 60 * 1000);

      logger.info('Notificación global procesada exitosamente', {
        id: globalNotificationId,
        totalPersons
      });
    } catch (error) {
      logger.error('Error procesando notificación global', {
        error: error.message,
        id: globalNotificationId
      });

      await globalNotificationRepo.update(globalNotificationId, {
        push_processing_status: 'failed',
        email_processing_status: 'failed'
      });
    }
  }

  /**
   * Obtiene el progreso de una notificación global
   * @param {string} globalNotificationId
   * @returns {Promise<Object>}
   */
  async obtenerProgreso(globalNotificationId) {
    const cache = SessionCacheUtil.getCache();
    const stateKey = `global_notif:${globalNotificationId}:batch_state`;
    const stateStr = await cache.get(stateKey);

    if (stateStr) {
      return JSON.parse(stateStr);
    }

    // Si no está en cache, obtener de BD
    return await globalNotificationRepo.getStatistics(globalNotificationId);
  }
}

module.exports = new GlobalNotificationService();
