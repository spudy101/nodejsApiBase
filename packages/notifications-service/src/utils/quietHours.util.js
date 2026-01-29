'use strict';

/**
 * Utilidad para manejo de quiet hours (horarios silenciosos)
 * Función pura - NO accede a BD ni tiene lógica de negocio
 */
class QuietHoursUtil {
  /**
   * Verifica si estamos en quiet hours
   * @param {Object} userPreference - Objeto con quiet_hours_start y quiet_hours_end
   * @returns {boolean}
   */
  static isInQuietHours(userPreference) {
    if (!userPreference?.quiet_hours_start || !userPreference?.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`;

    const start = userPreference.quiet_hours_start;
    const end = userPreference.quiet_hours_end;

    // Quiet hours dentro del mismo día (ej: 22:00 - 23:59)
    if (start < end) {
      return currentTime >= start && currentTime < end;
    }

    // Quiet hours cruzan medianoche (ej: 22:00 - 08:00)
    return currentTime >= start || currentTime < end;
  }

  /**
   * Calcula cuándo termina el quiet hours
   * @param {Object} userPreference - Objeto con quiet_hours_end
   * @returns {Date}
   */
  static calcularFinQuietHours(userPreference) {
    if (!userPreference?.quiet_hours_end) {
      return new Date(Date.now() + 15 * 60 * 1000); // +15 min por defecto
    }

    const now = new Date();
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
   * Calcula el siguiente momento disponible para envío
   * @param {Object} userPreference
   * @returns {Date}
   */
  static calcularProximoEnvio(userPreference) {
    if (!this.isInQuietHours(userPreference)) {
      return new Date(); // Enviar ahora
    }

    return this.calcularFinQuietHours(userPreference);
  }

  /**
   * Verifica si una fecha está fuera de quiet hours
   * @param {Date} fecha
   * @param {Object} userPreference
   * @returns {boolean}
   */
  static estaFueraDeQuietHours(fecha, userPreference) {
    if (!userPreference?.quiet_hours_start || !userPreference?.quiet_hours_end) {
      return true; // Sin quiet hours configurado
    }

    const time = `${fecha.getHours().toString().padStart(2, '0')}:${fecha.getMinutes().toString().padStart(2, '0')}:00`;
    const start = userPreference.quiet_hours_start;
    const end = userPreference.quiet_hours_end;

    if (start < end) {
      return time < start || time >= end;
    }

    return time < start && time >= end;
  }
}

module.exports = QuietHoursUtil;
