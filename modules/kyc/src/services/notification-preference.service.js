'use strict';

const { sequelize } = require('../../../../shared/models');
const userNotificationPreferenceRepository = require('../../../notification/repositories/user-notification-preference.repository');
const AppError      = require('../../../../shared/utils/app-error.util');
const { logger }    = require('../../../../shared/utils/logger.util');

const {
  NotificationPreferenceListDTO,
  UpdateGlobalPreferenceResponseDTO,
  UpdateTypePreferenceResponseDTO,
  BatchUpdateResponseDTO,
} = require('../dtos/notification-preference.dto');

class NotificationPreferenceService {

  /**
   * Obtiene todas las preferencias de notificación del usuario.
   *
   * @param {string} userId
   * @returns {Promise<NotificationPreferenceListDTO>}
   */
  async getPreferences(userId) {
    const preferences = await userNotificationPreferenceRepository.findAllByUser(userId);

    logger.info('Notification preferences retrieved', { userId, count: preferences.length });

    return new NotificationPreferenceListDTO(preferences);
  }

  /**
   * Actualiza la preferencia global de notificaciones.
   * La preferencia global es aquella donde notification_type_code = null.
   *
   * @param {object} data   - { allow_push?, allow_email?, quiet_hours_start?, quiet_hours_end? }
   * @param {string} userId
   * @returns {Promise<UpdateGlobalPreferenceResponseDTO>}
   */
  async updateGlobalPreference(data, userId) {
    const { allow_push, allow_email, quiet_hours_start, quiet_hours_end } = data;

    const updateData = {};
    if (allow_push        !== undefined) updateData.allow_push        = allow_push;
    if (allow_email       !== undefined) updateData.allow_email       = allow_email;
    if (quiet_hours_start !== undefined) updateData.quiet_hours_start = quiet_hours_start;
    if (quiet_hours_end   !== undefined) updateData.quiet_hours_end   = quiet_hours_end;

    const preference = await this._withTransaction(async (transaction) => {
      return userNotificationPreferenceRepository.upsertGlobalPreference(
        userId,
        updateData,
        { transaction }
      );
    });

    logger.info('Global notification preference updated', {
      userId,
      updatedFields: Object.keys(updateData),
    });

    return new UpdateGlobalPreferenceResponseDTO(preference);
  }

  /**
   * Crea o actualiza una preferencia específica para un tipo de notificación.
   *
   * @param {object} data   - { notification_type_code, allow_push?, allow_email? }
   * @param {string} userId
   * @returns {Promise<UpdateTypePreferenceResponseDTO>}
   */
  async updateTypePreference(data, userId) {
    const { notification_type_code, allow_push, allow_email } = data;

    if (!notification_type_code) {
      throw AppError.badRequest('El código de tipo de notificación es requerido');
    }

    const preference = await this._withTransaction(async (transaction) => {
      return userNotificationPreferenceRepository.upsertTypePreference(
        userId,
        notification_type_code,
        {
          allow_push:  allow_push  ?? true,
          allow_email: allow_email ?? true,
        },
        { transaction }
      );
    });

    logger.info('Type notification preference updated', {
      userId,
      notificationTypeCode: notification_type_code,
    });

    return new UpdateTypePreferenceResponseDTO(preference);
  }

  /**
   * Elimina una preferencia específica de tipo.
   * El usuario vuelve a heredar el comportamiento de la preferencia global.
   *
   * @param {string} notificationTypeCode
   * @param {string} userId
   * @returns {Promise<void>}
   */
  async deleteTypePreference(notificationTypeCode, userId) {
    if (!notificationTypeCode) {
      throw AppError.badRequest('El código de tipo de notificación es requerido');
    }

    const deleted = await this._withTransaction(async (transaction) => {
      return userNotificationPreferenceRepository.deleteTypePreference(
        userId,
        notificationTypeCode,
        { transaction }
      );
    });

    if (deleted === 0) {
      throw AppError.notFound('Preferencia no encontrada');
    }

    logger.info('Type notification preference deleted', { userId, notificationTypeCode });
  }

  /**
   * Actualiza múltiples preferencias de tipo en batch.
   * Items sin notification_type_code son ignorados silenciosamente.
   * Todas las operaciones se ejecutan en paralelo dentro de una sola transacción.
   *
   * @param {object} data   - { preferences: [{ notification_type_code, allow_push?, allow_email? }] }
   * @param {string} userId
   * @returns {Promise<BatchUpdateResponseDTO>}
   */
  async batchUpdateTypePreferences(data, userId) {
    const { preferences } = data;

    if (!Array.isArray(preferences) || preferences.length === 0) {
      throw AppError.badRequest('Se requiere un array de preferencias');
    }

    const validPreferences = preferences.filter(p => p.notification_type_code);

    const results = await this._withTransaction(async (transaction) => {
      // Paralelo — todas las operaciones dentro de la misma transacción
      return Promise.all(
        validPreferences.map(({ notification_type_code, allow_push, allow_email }) =>
          userNotificationPreferenceRepository.upsertTypePreference(
            userId,
            notification_type_code,
            {
              allow_push:  allow_push  ?? true,
              allow_email: allow_email ?? true,
            },
            { transaction }
          )
        )
      );
    });

    logger.info('Batch notification preferences updated', {
      userId,
      count: results.length,
    });

    return new BatchUpdateResponseDTO(results);
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  /**
   * Helper para encapsular el patrón transaction/commit/rollback.
   * Evita repetir el mismo try/catch en cada método que usa transacción.
   *
   * Uso:
   *   const result = await this._withTransaction(async (transaction) => {
   *     return repository.doSomething({ transaction });
   *   });
   *
   * @param {Function} fn - Función async que recibe la transacción y retorna el resultado
   * @private
   */
  async _withTransaction(fn) {
    const transaction = await sequelize.transaction();
    try {
      const result = await fn(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = new NotificationPreferenceService();