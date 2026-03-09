'use strict';

const globalNotificationRepo            = require('../../repositories/global-notification.repository');
const userNotificationPreferenceRepo    = require('../../../../shared/kyc/repositories/user-notification-preference.repository');
const userPushTokenRepo                 = require('../../repositories/user-push-token.repository');
const redisClient                       = require('../../../../../shared/utils/redis.util');
const localCache                        = require('../../../../../shared/utils/cache.util');
const emailService                      = require('./email-notification.service');
const pushService                       = require('./push-notification.service');
const rateLimitService                  = require('./notification-rate-limit.service');
const { logger }                        = require('../../../../shared/utils/logger.util');

class NotificationBatchService {

  /**
   * Procesa notificación global por lotes (push + email)
   * @param {string} globalNotificationId
   * @param {Object} notificationType
   * @param {string} title
   * @param {string} body
   * @param {Object} metadata
   */
  async procesarNotificacionGlobal(globalNotificationId, notificationType, title, body, metadata) {
    try {
      const cache = redisClient.isAvailable() ? redisClient : localCache;

      const userRepository = require('../../kyc/repositories/user.repository');
      const allUsers       = await userRepository.findAll(
        { is_active: true },
        {
          attributes: ['user_id'],
          include:    userRepository.INCLUDES.basic,
        }
      );

      const totalUsers  = allUsers.length;
      const batchSize   = 100;

      await globalNotificationRepo.update(globalNotificationId, {
        total_target_users:    totalUsers,
        processing_started_at: new Date(),
      });

      await cache.set(
        `global_notif:${globalNotificationId}:batch_state`,
        JSON.stringify({
          total_users:     totalUsers,
          processed_users: 0,
          current_batch:   0,
          batch_size:      batchSize,
          status:          'processing',
          started_at:      new Date().toISOString(),
        }),
        24 * 60 * 60
      );

      // PUSH
      if (notificationType.supports_push) {
        await globalNotificationRepo.updatePushProcessingStatus(globalNotificationId, 'processing');

        await this.enviarPushGlobalPorLotes(
          globalNotificationId, allUsers, title, body, metadata, notificationType.code, cache
        );

        await globalNotificationRepo.updatePushProcessingStatus(globalNotificationId, 'completed');
      }

      // EMAIL
      if (notificationType.supports_email) {
        await globalNotificationRepo.updateEmailProcessingStatus(globalNotificationId, 'processing');

        await this.enviarEmailGlobalPorLotes(
          globalNotificationId, allUsers, notificationType, metadata, notificationType.code, cache
        );

        await globalNotificationRepo.updateEmailProcessingStatus(globalNotificationId, 'completed');
      }

      await globalNotificationRepo.update(globalNotificationId, {
        processing_completed_at: new Date(),
      });

      // Limpiar estado de Redis después de 1 hora
      setTimeout(async () => {
        await cache.del(`global_notif:${globalNotificationId}:batch_state`);
      }, 60 * 60 * 1000);

    } catch (error) {
      logger.error('Error en procesamiento global', { error: error.message, globalNotificationId });

      await globalNotificationRepo.update(globalNotificationId, {
        push_processing_status:  'failed',
        email_processing_status: 'failed',
      });
    }
  }

  /**
   * Envía push global por lotes con rate limiting
   */
  async enviarPushGlobalPorLotes(globalNotificationId, users, title, body, metadata, notificationTypeCode, cache) {
    try {
      const usersAllowingPush = [];

      for (const user of users) {
        const allowsPush = await userNotificationPreferenceRepo.userAllowsPush(
          user.user_id,
          notificationTypeCode
        );
        if (allowsPush) usersAllowingPush.push(user);
      }

      logger.info('Usuarios que permiten push', {
        total:    users.length,
        allowing: usersAllowingPush.length,
      });

      const userIds  = usersAllowingPush.map(u => u.user_id);
      const allTokens = await userPushTokenRepo.findActiveByUsers(userIds);

      if (allTokens.length === 0) {
        logger.warn('No hay tokens activos para push global');
        return;
      }

      const batchSize   = 100;
      const totalBatches = Math.ceil(allTokens.length / batchSize);

      logger.info('Iniciando envío push global por lotes', {
        globalNotificationId,
        totalTokens: allTokens.length,
        batchSize,
        totalBatches,
      });

      let totalSuccess = 0;
      let totalFailed  = 0;

      for (let i = 0; i < totalBatches; i++) {
        const batch       = allTokens.slice(i * batchSize, (i + 1) * batchSize);
        const endpointArns = batch.map(t => t.token);

        await rateLimitService.checkSNSRateLimit(cache);

        logger.info(`Procesando lote push ${i + 1}/${totalBatches}`, {
          globalNotificationId,
          tokensEnLote: endpointArns.length,
        });

        const stats = await pushService.enviarPushMasivo(endpointArns, title, body, metadata);

        totalSuccess += stats.success;
        totalFailed  += stats.failed;

        await globalNotificationRepo.incrementPushSentCount(globalNotificationId, stats.success);
        await this._actualizarEstadoLote(cache, globalNotificationId, i + 1, batch.length);

        if (i < totalBatches - 1) await this._sleep(1000);
      }

      logger.info('Push global completado', {
        globalNotificationId,
        totalTokens: allTokens.length,
        success:     totalSuccess,
        failed:      totalFailed,
      });

    } catch (error) {
      logger.error('Error al enviar push global', { error: error.message, globalNotificationId });
      throw error;
    }
  }

  /**
   * Envía email global por lotes con rate limiting
   */
  async enviarEmailGlobalPorLotes(globalNotificationId, users, notificationType, metadata, notificationTypeCode, cache) {
    try {
      const usersAllowingEmail = [];

      for (const user of users) {
        const allowsEmail = await userNotificationPreferenceRepo.userAllowsEmail(
          user.user_id,
          notificationTypeCode
        );
        if (allowsEmail && user.person?.contact?.email) {
          usersAllowingEmail.push(user);
        }
      }

      logger.info('Usuarios que permiten email', {
        total:    users.length,
        allowing: usersAllowingEmail.length,
      });

      if (usersAllowingEmail.length === 0) {
        logger.warn('No hay usuarios con email habilitado');
        return;
      }

      const batchSize   = 50;
      const totalBatches = Math.ceil(usersAllowingEmail.length / batchSize);

      logger.info('Iniciando envío email global por lotes', {
        globalNotificationId,
        totalEmails: usersAllowingEmail.length,
        batchSize,
        totalBatches,
      });

      let totalSuccess = 0;
      let totalFailed  = 0;

      for (let i = 0; i < totalBatches; i++) {
        const batch = usersAllowingEmail.slice(i * batchSize, (i + 1) * batchSize);

        await rateLimitService.checkSESRateLimit(cache);

        logger.info(`Procesando lote email ${i + 1}/${totalBatches}`, {
          globalNotificationId,
          emailsEnLote: batch.length,
        });

        const promises = batch.map(user =>
          emailService.enviarNotificacion(user.person.contact.email, notificationType, metadata)
            .then(() => ({ success: true  }))
            .catch(err => {
              logger.error('Error enviando email', {
                error: err.message,
                email: user.person.contact.email,
              });
              return { success: false };
            })
        );

        const results      = await Promise.allSettled(promises);
        const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
        const failedCount  = batch.length - successCount;

        totalSuccess += successCount;
        totalFailed  += failedCount;

        await globalNotificationRepo.incrementEmailSentCount(globalNotificationId, successCount);

        if (i < totalBatches - 1) await this._sleep(1000);
      }

      logger.info('Email global completado', {
        globalNotificationId,
        totalEmails: usersAllowingEmail.length,
        success:     totalSuccess,
        failed:      totalFailed,
      });

    } catch (error) {
      logger.error('Error al enviar email global', { error: error.message, globalNotificationId });
      throw error;
    }
  }

  /** @private */
  async _actualizarEstadoLote(cache, globalNotificationId, batchNumber, batchSize) {
    try {
      const stateKey = `global_notif:${globalNotificationId}:batch_state`;
      const stateStr = await cache.get(stateKey);

      if (stateStr) {
        const state = JSON.parse(stateStr);
        state.processed_users += batchSize;
        state.current_batch    = batchNumber;
        state.last_batch_at    = new Date().toISOString();

        await cache.set(stateKey, JSON.stringify(state), 24 * 60 * 60);
      }
    } catch (error) {
      logger.error('Error actualizando estado de lote en Redis', { error: error.message });
    }
  }

  /** @private */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new NotificationBatchService();