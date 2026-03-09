'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { logger }                      = require('../../../../shared/utils/logger.util');
const { notifications, aws }          = require('../../../../shared/constants');

class EmailNotificationService {
  constructor() {
    this.sesClient = new SESClient({
      region: aws.region,
      credentials: {
        accessKeyId:     aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
      },
    });
  }

  /**
   * Envía un email usando los templates de un notification_type
   * @param {string} destinatario       - Email del destinatario
   * @param {Object} notificationType   - Objeto con los templates del notification_type
   * @param {Object} datos              - Datos para reemplazar en los templates
   */
  async enviarNotificacion(destinatario, notificationType, datos) {
    try {
      if (!notificationType.supports_email) {
        logger.warn('El tipo de notificación no soporta email', {
          notificationType: notificationType.code,
        });
        return null;
      }

      if (!notificationType.email_subject_template || !notificationType.email_body_template) {
        logger.error('El tipo de notificación no tiene templates de email configurados', {
          notificationType: notificationType.code,
        });
        return null;
      }

      const asunto     = this._reemplazarVariables(notificationType.email_subject_template, datos);
      const cuerpoHtml = this._reemplazarVariables(notificationType.email_body_template,    datos);

      return await this.enviarEmail(destinatario, asunto, cuerpoHtml);
    } catch (error) {
      logger.error('Error al enviar notificación por email', {
        error:            error.message,
        destinatario,
        notificationType: notificationType.code,
      });
      return null;
    }
  }

  /**
   * Envía un email usando AWS SES
   * @param {string} destinatario - Email del destinatario
   * @param {string} asunto       - Asunto del email
   * @param {string} cuerpoHtml   - Cuerpo del email en HTML
   * @param {string} cuerpoTexto  - Cuerpo del email en texto plano (opcional)
   */
  async enviarEmail(destinatario, asunto, cuerpoHtml, cuerpoTexto = '') {
    try {
      const params = {
        Source:      notifications.ses.fromEmail,
        Destination: { ToAddresses: [destinatario] },
        Message: {
          Subject: { Data: asunto,     Charset: 'UTF-8' },
          Body: {
            Html: { Data: cuerpoHtml, Charset: 'UTF-8' },
            ...(cuerpoTexto && {
              Text: { Data: cuerpoTexto, Charset: 'UTF-8' },
            }),
          },
        },
      };

      const command  = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);

      logger.info('Email enviado exitosamente', {
        destinatario,
        messageId: response.MessageId,
      });

      return response;
    } catch (error) {
      logger.error('Error al enviar email', { error: error.message, destinatario, asunto });
      return null;
    }
  }

  /**
   * Envía emails masivos a múltiples destinatarios
   * @param {Array<{ email: string, metadata: Object }>} destinatarios
   * @param {Object} notificationType - Tipo de notificación con templates
   * @returns {Promise<{ success: number, failed: number }>}
   */
  async enviarEmailMasivo(destinatarios, notificationType) {
    try {
      const promises = destinatarios.map(dest =>
        this.enviarNotificacion(dest.email, notificationType, dest.metadata)
          .then(() => ({ success: true  }))
          .catch(() => ({ success: false }))
      );

      const results = await Promise.allSettled(promises);

      const stats = {
        success: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
        failed:  results.filter(r => r.status === 'rejected'  || !r.value.success).length,
      };

      logger.info('Email masivo completado', { ...stats, total: destinatarios.length });

      return stats;
    } catch (error) {
      logger.error('Error al enviar email masivo', { error: error.message });
      return { success: 0, failed: destinatarios.length };
    }
  }

  /**
   * Reemplaza variables {{variable}} en un template
   * @private
   */
  _reemplazarVariables(template, datos) {
    if (!template) return '';
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return datos[variable] !== undefined ? datos[variable] : match;
    });
  }
}

module.exports = new EmailNotificationService();