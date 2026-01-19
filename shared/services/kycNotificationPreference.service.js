'use strict';

const userNotificationPreferenceRepository = require('../repositories/userNotificationPreference.repository');
const { NotificationPreferenceListDTO, UpdateGlobalPreferenceResponseDTO, UpdateTypePreferenceResponseDTO, BatchUpdateResponseDTO } = require('../dtos/kycNotificationPreference.dto');
const AppError = require('../utils/appError.util');
const { logger } = require('../utils/logger.util');
const { sequelize } = require('../models');

class KycNotificationPreferenceService {

  /**
   * Obtiene todas las preferencias de notificación del usuario
   */
  async getPreferences(metadata) {
    const { userId } = metadata;

    try {
      const preferences = await userNotificationPreferenceRepository.findAllByUser(userId);

      logger.info('Notification preferences retrieved', { userId, count: preferences.length });

      return new NotificationPreferenceListDTO(preferences);
    } catch (error) {
      logger.error('Error retrieving notification preferences', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Actualiza la preferencia global de notificaciones
   * La preferencia global es aquella donde notification_type_code = null
   */
  async updateGlobalPreference(data, metadata) {
    const { userId } = metadata;
    const { allow_push, allow_email, quiet_hours_start, quiet_hours_end } = data;

    const transaction = await sequelize.transaction();

    try {
      const updateData = {};
      
      if (allow_push !== undefined) {
        updateData.allow_push = allow_push;
      }
      
      if (allow_email !== undefined) {
        updateData.allow_email = allow_email;
      }
      
      if (quiet_hours_start !== undefined) {
        updateData.quiet_hours_start = quiet_hours_start;
      }
      
      if (quiet_hours_end !== undefined) {
        updateData.quiet_hours_end = quiet_hours_end;
      }

      const preference = await userNotificationPreferenceRepository.upsertGlobalPreference(
        userId,
        updateData,
        { transaction }
      );

      await transaction.commit();

      logger.info('Global notification preference updated', { 
        userId, 
        updatedFields: Object.keys(updateData) 
      });

      return new UpdateGlobalPreferenceResponseDTO(preference);
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating global notification preference', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Crea o actualiza una preferencia específica para un tipo de notificación
   */
  async updateTypePreference(data, metadata) {
    const { userId } = metadata;
    const { notification_type_code, allow_push, allow_email } = data;

    if (!notification_type_code) {
      throw AppError.badRequest('El código de tipo de notificación es requerido');
    }

    const transaction = await sequelize.transaction();

    try {
      const preference = await userNotificationPreferenceRepository.upsertTypePreference(
        userId,
        notification_type_code,
        {
          allow_push: allow_push ?? true,
          allow_email: allow_email ?? true
        },
        { transaction }
      );

      await transaction.commit();

      logger.info('Type notification preference updated', { 
        userId, 
        notificationTypeCode: notification_type_code 
      });

      return new UpdateTypePreferenceResponseDTO(preference);
    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating type notification preference', { 
        userId, 
        notificationTypeCode: notification_type_code,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Elimina una preferencia específica de tipo (vuelve a usar la global)
   */
  async deleteTypePreference(data, metadata) {
    const { userId } = metadata;
    const { notification_type_code } = data;

    if (!notification_type_code) {
      throw AppError.badRequest('El código de tipo de notificación es requerido');
    }

    const transaction = await sequelize.transaction();

    try {
      const deleted = await userNotificationPreferenceRepository.deleteTypePreference(
        userId,
        notification_type_code,
        { transaction }
      );

      if (deleted === 0) {
        throw AppError.notFound('Preferencia no encontrada');
      }

      await transaction.commit();

      logger.info('Type notification preference deleted', { 
        userId, 
        notificationTypeCode: notification_type_code 
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error deleting type notification preference', { 
        userId, 
        notificationTypeCode: notification_type_code,
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Actualiza múltiples preferencias de tipo en batch
   * Útil para configurar varias preferencias a la vez
   */
  async batchUpdateTypePreferences(data, metadata) {
    const { userId } = metadata;
    const { preferences } = data;

    if (!Array.isArray(preferences) || preferences.length === 0) {
      throw AppError.badRequest('Se requiere un array de preferencias');
    }

    const transaction = await sequelize.transaction();

    try {
      const results = [];

      for (const pref of preferences) {
        const { notification_type_code, allow_push, allow_email } = pref;

        if (!notification_type_code) {
          continue;
        }

        const preference = await userNotificationPreferenceRepository.upsertTypePreference(
          userId,
          notification_type_code,
          {
            allow_push: allow_push ?? true,
            allow_email: allow_email ?? true
          },
          { transaction }
        );

        results.push(preference);
      }

      await transaction.commit();

      logger.info('Batch notification preferences updated', { 
        userId, 
        count: results.length 
      });

      return new BatchUpdateResponseDTO(results);
    } catch (error) {
      await transaction.rollback();
      logger.error('Error batch updating notification preferences', { 
        userId, 
        error: error.message 
      });
      throw error;
    }
  }
}

module.exports = new KycNotificationPreferenceService();