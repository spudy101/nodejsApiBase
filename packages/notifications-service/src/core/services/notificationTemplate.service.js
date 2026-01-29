'use strict';

const TemplateRenderer = require('../../utils/templateRenderer.util');
const { logger } = require('@abundbank/shared');
const AppError = require('@abundbank/shared');

/**
 * Servicio para manejo de templates de notificaciones
 * Responsabilidad: Generar y validar contenido desde templates
 */
class NotificationTemplateService {
  /**
   * Genera título y cuerpo usando templates del notification_type
   * @param {Object} notificationType - Objeto NotificationType completo
   * @param {Object} metadata - Datos para reemplazar en templates
   * @returns {{title: string, body: string, emailSubject: string, emailBody: string}}
   */
  generateContent(notificationType, metadata = {}) {
    try {
      const title = TemplateRenderer.render(
        notificationType.title_template, 
        metadata
      );

      const body = TemplateRenderer.render(
        notificationType.body_template, 
        metadata
      );

      const emailSubject = notificationType.email_subject_template 
        ? TemplateRenderer.render(notificationType.email_subject_template, metadata)
        : title;

      const emailBody = notificationType.email_body_template
        ? TemplateRenderer.render(notificationType.email_body_template, metadata)
        : body;

      return {
        title,
        body,
        emailSubject,
        emailBody
      };
    } catch (error) {
      logger.error('Error generando contenido desde templates', {
        error: error.message,
        notificationType: notificationType.code
      });
      throw AppError.internal('Error al generar contenido de notificación');
    }
  }

  /**
   * Valida que un notification_type tenga templates válidos
   * @param {Object} notificationType
   * @returns {{valid: boolean, errors: Array<string>}}
   */
  validateTemplates(notificationType) {
    const errors = [];

    // Validar templates obligatorios
    if (!notificationType.title_template) {
      errors.push('title_template es requerido');
    } else if (!TemplateRenderer.isValid(notificationType.title_template)) {
      errors.push('title_template tiene formato inválido');
    }

    if (!notificationType.body_template) {
      errors.push('body_template es requerido');
    } else if (!TemplateRenderer.isValid(notificationType.body_template)) {
      errors.push('body_template tiene formato inválido');
    }

    // Validar templates de email si soporta email
    if (notificationType.supports_email) {
      if (notificationType.email_subject_template && 
          !TemplateRenderer.isValid(notificationType.email_subject_template)) {
        errors.push('email_subject_template tiene formato inválido');
      }

      if (notificationType.email_body_template && 
          !TemplateRenderer.isValid(notificationType.email_body_template)) {
        errors.push('email_body_template tiene formato inválido');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Valida que los datos proporcionados sean suficientes para los templates
   * @param {Object} notificationType
   * @param {Object} metadata
   * @returns {{valid: boolean, missing: Array<string>}}
   */
  validateMetadata(notificationType, metadata) {
    const allMissing = new Set();

    // Validar title_template
    const titleValidation = TemplateRenderer.validateData(
      notificationType.title_template, 
      metadata
    );
    titleValidation.missing.forEach(m => allMissing.add(m));

    // Validar body_template
    const bodyValidation = TemplateRenderer.validateData(
      notificationType.body_template, 
      metadata
    );
    bodyValidation.missing.forEach(m => allMissing.add(m));

    // Validar email templates si aplica
    if (notificationType.supports_email) {
      if (notificationType.email_subject_template) {
        const emailSubjectValidation = TemplateRenderer.validateData(
          notificationType.email_subject_template, 
          metadata
        );
        emailSubjectValidation.missing.forEach(m => allMissing.add(m));
      }

      if (notificationType.email_body_template) {
        const emailBodyValidation = TemplateRenderer.validateData(
          notificationType.email_body_template, 
          metadata
        );
        emailBodyValidation.missing.forEach(m => allMissing.add(m));
      }
    }

    const missing = Array.from(allMissing);

    return {
      valid: missing.length === 0,
      missing
    };
  }

  /**
   * Extrae todas las variables requeridas de un notification_type
   * @param {Object} notificationType
   * @returns {Array<string>}
   */
  extractRequiredVariables(notificationType) {
    const allVars = new Set();

    // Extraer de title
    const titleVars = TemplateRenderer.extractVariables(notificationType.title_template);
    titleVars.forEach(v => allVars.add(v));

    // Extraer de body
    const bodyVars = TemplateRenderer.extractVariables(notificationType.body_template);
    bodyVars.forEach(v => allVars.add(v));

    // Extraer de email templates
    if (notificationType.email_subject_template) {
      const emailSubjectVars = TemplateRenderer.extractVariables(
        notificationType.email_subject_template
      );
      emailSubjectVars.forEach(v => allVars.add(v));
    }

    if (notificationType.email_body_template) {
      const emailBodyVars = TemplateRenderer.extractVariables(
        notificationType.email_body_template
      );
      emailBodyVars.forEach(v => allVars.add(v));
    }

    return Array.from(allVars);
  }
}

module.exports = new NotificationTemplateService();
