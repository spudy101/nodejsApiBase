'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { logger } = require('./logger.util');

class SESUtil {
  static sesClient = new SESClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  /**
   * Reemplaza las variables en un template usando el formato {{variable}}
   * @param {string} template - Template con variables en formato {{variable}}
   * @param {Object} datos - Objeto con los valores para reemplazar
   * @returns {string} Template con variables reemplazadas
   */
  static reemplazarVariables(template, datos) {
    if (!template) return '';
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      return datos[variable] !== undefined ? datos[variable] : match;
    });
  }

  /**
   * Envía un email usando los templates de un notification_type
   * @param {string} destinatario - Email del destinatario
   * @param {Object} notificationType - Objeto con los templates del notification_type
   * @param {Object} datos - Datos para reemplazar en los templates
   * @returns {Promise} Respuesta de SES
   */
  static async enviarNotificacion(destinatario, notificationType, datos) {
    try {
      // Validar que el notification_type soporte email
      if (!notificationType.supports_email) {
        logger.warn('El tipo de notificación no soporta email', { 
          notificationType: notificationType.code 
        });
        return null;
      }

      // Validar que tenga los templates de email
      if (!notificationType.email_subject_template || !notificationType.email_body_template) {
        logger.error('El tipo de notificación no tiene templates de email configurados', {
          notificationType: notificationType.code
        });
        return null;
      }

      // Reemplazar variables en los templates
      const asunto = this.reemplazarVariables(notificationType.email_subject_template, datos);
      const cuerpoHtml = this.reemplazarVariables(notificationType.email_body_template, datos);

      // Enviar el email
      return await this.enviarEmail(destinatario, asunto, cuerpoHtml);
    } catch (error) {
      logger.error('Error al enviar notificación por email', {
        error: error.message,
        destinatario,
        notificationType: notificationType.code
      });
      // No lanzar error para no bloquear el flujo
      return null;
    }
  }

  /**
   * Envía un email usando AWS SES
   * @param {string} destinatario - Email del destinatario
   * @param {string} asunto - Asunto del email
   * @param {string} cuerpoHtml - Cuerpo del email en HTML
   * @param {string} cuerpoTexto - Cuerpo del email en texto plano (opcional)
   * @returns {Promise} Respuesta de SES
   */
  static async enviarEmail(destinatario, asunto, cuerpoHtml, cuerpoTexto = '') {
    try {
      const params = {
        Source: process.env.SES_FROM_EMAIL || 'DemocraciaLiquida <no-reply@mensajeria.democraciaonline.com>',
        Destination: {
          ToAddresses: [destinatario],
        },
        Message: {
          Subject: {
            Data: asunto,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: cuerpoHtml,
              Charset: 'UTF-8',
            },
            ...(cuerpoTexto && {
              Text: {
                Data: cuerpoTexto,
                Charset: 'UTF-8',
              },
            }),
          },
        },
      };

      const command = new SendEmailCommand(params);
      const response = await this.sesClient.send(command);

      logger.info('Email enviado exitosamente', { 
        destinatario, 
        messageId: response.MessageId 
      });
      
      return response;
    } catch (error) {
      logger.error('Error al enviar email', {
        error: error.message,
        destinatario,
        asunto
      });
      // No lanzar error para no bloquear el flujo
      return null;
    }
  }

  /**
   * Envía múltiples emails en paralelo
   * @param {Array} emails - Array de objetos con {destinatario, notificationType, datos}
   * @returns {Promise<Array>} Array con las respuestas de SES
   */
  static async enviarNotificacionesMasivas(emails) {
    try {
      const promises = emails.map(({ destinatario, notificationType, datos }) =>
        this.enviarNotificacion(destinatario, notificationType, datos)
          .catch(err => {
            logger.error('Error en envío masivo individual', {
              error: err.message,
              destinatario
            });
            return null;
          })
      );

      const resultados = await Promise.all(promises);
      
      const exitosos = resultados.filter(r => r !== null).length;
      const fallidos = resultados.length - exitosos;

      logger.info('Envío masivo completado', { 
        total: emails.length, 
        exitosos, 
        fallidos 
      });

      return resultados;
    } catch (error) {
      logger.error('Error en envío masivo de emails', { error: error.message });
      throw error;
    }
  }
}

module.exports = SESUtil;