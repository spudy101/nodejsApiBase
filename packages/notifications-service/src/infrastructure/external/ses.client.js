'use strict';

const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { logger } = require('@abundbank/shared');
const { ses, aws } = require('../../config');

/**
 * Cliente para AWS SES - Solo responsable de comunicación con AWS
 * NO contiene lógica de negocio
 */
class SESClientWrapper {
  constructor() {
    this.client = new SESClient({
      region: aws.region,
      credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
      },
    });
  }

  /**
   * Envía un email usando AWS SES
   * @param {string} destinatario - Email del destinatario
   * @param {string} asunto - Asunto del email
   * @param {string} cuerpoHtml - Cuerpo del email en HTML
   * @param {string} cuerpoTexto - Cuerpo del email en texto plano (opcional)
   * @returns {Promise<Object>} Respuesta de SES
   */
  async enviarEmail(destinatario, asunto, cuerpoHtml, cuerpoTexto = '') {
    try {
      const params = {
        Source: ses.fromEmail,
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
      const response = await this.client.send(command);

      logger.info('Email enviado exitosamente via SES', { 
        destinatario, 
        messageId: response.MessageId 
      });
      
      return response;
    } catch (error) {
      logger.error('Error al enviar email via SES', {
        error: error.message,
        destinatario,
        asunto
      });
      throw error;
    }
  }

  /**
   * Envía múltiples emails (wrapper para envío masivo)
   * @param {Array<{destinatario, asunto, cuerpoHtml, cuerpoTexto}>} emails
   * @returns {Promise<Array>}
   */
  async enviarEmailsMasivo(emails) {
    const promises = emails.map(email => 
      this.enviarEmail(
        email.destinatario,
        email.asunto,
        email.cuerpoHtml,
        email.cuerpoTexto
      ).catch(error => ({
        destinatario: email.destinatario,
        error: error.message,
        success: false
      }))
    );

    return await Promise.allSettled(promises);
  }
}

module.exports = new SESClientWrapper();