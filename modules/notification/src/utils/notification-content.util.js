'use strict';

// ============================================================
// NOTIFICATION CONTENT UTIL
// ============================================================
// Funciones puras para generación de contenido y prioridades.
// Absorbe notificationPriority.util.js — sin lógica de negocio,
// sin repositorios, reutilizable en cualquier contexto.

class NotificationContentUtil {

  // ============================================================
  // CONTENT GENERATION
  // ============================================================

  /**
   * Genera título y cuerpo usando templates del notification_type
   * @param {Object} notificationType - Tipo de notificación con templates
   * @param {Object} metadata         - Datos para reemplazar variables
   * @returns {{ title, body, emailSubject, emailBody }}
   */
  static generarContenido(notificationType, metadata) {
    const title = this.reemplazarVariables(notificationType.title_template, metadata);
    const body  = this.reemplazarVariables(notificationType.body_template,  metadata);

    let emailSubject = '';
    let emailBody    = '';

    if (notificationType.email_subject_template) {
      emailSubject = this.reemplazarVariables(notificationType.email_subject_template, metadata);
    }

    if (notificationType.email_body_template) {
      emailBody = this.reemplazarVariables(notificationType.email_body_template, metadata);
    }

    return { title, body, emailSubject, emailBody };
  }

  /**
   * Reemplaza variables {{variable}} con valores de metadata
   * @param {string} template - Template con variables
   * @param {Object} data     - Datos para reemplazar
   * @returns {string}
   */
  static reemplazarVariables(template, data) {
    if (!template) return '';

    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return data[variable] !== undefined ? data[variable] : match;
    });
  }

  // ============================================================
  // PRIORITY MAPPING
  // (absorbido de notificationPriority.util.js)
  // ============================================================

  /**
   * Mapea prioridad string → número para ordenamiento en BD
   * @param {'low'|'normal'|'high'|'urgent'} priority
   * @returns {number}
   */
  static mapPriority(priority) {
    const priorityMap = {
      low:    3,
      normal: 5,
      high:   8,
      urgent: 10,
    };

    return priorityMap[priority] || 5;
  }
}

module.exports = NotificationContentUtil;