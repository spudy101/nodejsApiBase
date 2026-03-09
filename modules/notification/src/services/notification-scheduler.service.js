'use strict';

const notificationRepo = require('../../repositories/notification.repository');
const { logger }       = require('../../../../shared/utils/logger.util');

class NotificationSchedulerService {

  /**
   * Verifica si estamos en quiet hours
   * @param {Object} userPreference - Preferencias del usuario
   * @returns {boolean}
   */
  isInQuietHours(userPreference) {
    if (!userPreference?.quiet_hours_start || !userPreference?.quiet_hours_end) {
      return false;
    }

    const now         = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    const start = userPreference.quiet_hours_start;
    const end   = userPreference.quiet_hours_end;

    // Quiet hours dentro del mismo día (ej: 22:00 - 23:59)
    if (start < end) {
      return currentTime >= start && currentTime < end;
    }

    // Quiet hours cruzan medianoche (ej: 22:00 - 08:00)
    return currentTime >= start || currentTime < end;
  }

  /**
   * Calcula cuándo termina el quiet hours
   * @param {Object} userPreference - Preferencias del usuario
   * @returns {Date}
   */
  calcularFinQuietHours(userPreference) {
    if (!userPreference?.quiet_hours_end) {
      return new Date(Date.now() + 15 * 60 * 1000); // +15 min por defecto
    }

    const now          = new Date();
    const [hours, minutes] = userPreference.quiet_hours_end.split(':');

    const endTime = new Date(now);
    endTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Si la hora ya pasó hoy, programar para mañana
    if (endTime <= now) {
      endTime.setDate(endTime.getDate() + 1);
    }

    return endTime;
  }

  /**
   * Programa envío de push para después de quiet hours
   * @param {string} notificationId - ID de la notificación
   * @param {Object} userPreference - Preferencias del usuario
   */
  async programarEnvioPush(notificationId, userPreference) {
    const nextRetryAt = this.calcularFinQuietHours(userPreference);

    await notificationRepo.update(notificationId, {
      scheduled_for:       nextRetryAt,
      push_next_retry_at:  nextRetryAt,
    });

    logger.info('Push programado para después de quiet hours', { notificationId, nextRetryAt });
  }

  /**
   * Programa envío de email para después de quiet hours
   * @param {string} notificationId - ID de la notificación
   * @param {Object} userPreference - Preferencias del usuario
   */
  async programarEnvioEmail(notificationId, userPreference) {
    const nextRetryAt = this.calcularFinQuietHours(userPreference);

    await notificationRepo.update(notificationId, {
      scheduled_for:        nextRetryAt,
      email_next_retry_at:  nextRetryAt,
    });

    logger.info('Email programado para después de quiet hours', { notificationId, nextRetryAt });
  }

  /**
   * Obtiene notificaciones programadas listas para enviar
   * @returns {Promise<Array>}
   */
  async procesarNotificacionesProgramadas() {
    try {
      const scheduled = await notificationRepo.findScheduledReady();

      logger.info('Procesando notificaciones programadas', { count: scheduled.length });

      return scheduled;
    } catch (error) {
      logger.error('Error obteniendo notificaciones programadas', { error: error.message });
      throw error;
    }
  }
}

module.exports = new NotificationSchedulerService();