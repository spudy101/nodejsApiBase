'use strict';

const { 
  SNSClient, 
  CreatePlatformEndpointCommand,
  DeleteEndpointCommand,
  PublishCommand,
} = require('@aws-sdk/client-sns');
const { logger } = require('@abundbank/shared');
const AppError = require('@abundbank/shared');
const { sns, aws } = require('../../config');

/**
 * Cliente para AWS SNS - Solo responsable de comunicación con AWS
 * NO contiene lógica de negocio
 */
class SNSClientWrapper {
  constructor() {
    this.client = new SNSClient({
      region: aws.region,
      credentials: {
        accessKeyId: aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
      },
    });

    this.PLATFORM_ARNS = {
      ios: sns.platformArnIos,
      android: sns.platformArnAndroid,
    };
  }

  /**
   * Registra un dispositivo para recibir push notifications
   * @param {string} deviceToken - Token del dispositivo
   * @param {string} platform - 'ios' o 'android'
   * @param {string} personId - ID de la persona (para custom user data)
   * @returns {Promise<string>} EndpointArn
   */
  async registrarDispositivo(deviceToken, platform, personId) {
    try {
      const platformArn = this.PLATFORM_ARNS[platform.toLowerCase()];
      
      if (!platformArn) {
        throw AppError.badRequest(`Plataforma no soportada: ${platform}`);
      }

      const params = {
        PlatformApplicationArn: platformArn,
        Token: deviceToken,
        CustomUserData: personId,
      };

      const command = new CreatePlatformEndpointCommand(params);
      const response = await this.client.send(command);
      
      logger.info('Dispositivo registrado exitosamente en SNS', { 
        personId, 
        platform, 
        endpointArn: response.EndpointArn 
      });
      
      return response.EndpointArn;
    } catch (error) {
      logger.error('Error al registrar dispositivo en SNS', { 
        error: error.message, 
        personId, 
        platform 
      });
      throw AppError.internal('Error al registrar dispositivo para notificaciones');
    }
  }

  /**
   * Elimina un endpoint de SNS (desregistrar dispositivo)
   * @param {string} endpointArn - ARN del endpoint a eliminar
   */
  async eliminarDispositivo(endpointArn) {
    try {
      const command = new DeleteEndpointCommand({ EndpointArn: endpointArn });
      await this.client.send(command);
      
      logger.info('Dispositivo eliminado exitosamente de SNS', { endpointArn });
      return true;
    } catch (error) {
      logger.error('Error al eliminar dispositivo de SNS', { 
        error: error.message, 
        endpointArn 
      });
      throw AppError.internal('Error al eliminar dispositivo');
    }
  }

  /**
   * Envía una notificación push a un dispositivo específico
   * @param {string} endpointArn - ARN del endpoint
   * @param {string} title - Título de la notificación
   * @param {string} body - Cuerpo de la notificación
   * @param {object} data - Datos adicionales (opcional)
   */
  async enviarPushIndividual(endpointArn, title, body, data = {}) {
    try {
      // Formato para iOS y Android
      const message = {
        default: body,
        APNS: JSON.stringify({
          aps: {
            alert: {
              title: title,
              body: body,
            },
            sound: 'default',
            badge: 1,
          },
          data: data,
        }),
        GCM: JSON.stringify({
          notification: {
            title: title,
            body: body,
            sound: 'default',
          },
          data: data,
        }),
      };

      const params = {
        TargetArn: endpointArn,
        Message: JSON.stringify(message),
        MessageStructure: 'json',
      };

      const command = new PublishCommand(params);
      const response = await this.client.send(command);
      
      logger.info('Push individual enviado exitosamente via SNS', { 
        endpointArn, 
        title 
      });
      
      return response;
    } catch (error) {
      logger.error('Error al enviar push individual via SNS', { 
        error: error.message, 
        endpointArn 
      });
      throw error;
    }
  }

  /**
   * Envía notificaciones push masivas a múltiples dispositivos
   * @param {Array<string>} endpointArns - Array de ARNs de endpoints
   * @param {string} title - Título de la notificación
   * @param {string} body - Cuerpo de la notificación
   * @param {object} data - Datos adicionales (opcional)
   * @returns {Promise<{success: number, failed: number}>}
   */
  async enviarPushMasivo(endpointArns, title, body, data = {}) {
    try {
      const promises = endpointArns.map(arn => 
        this.enviarPushIndividual(arn, title, body, data)
          .then(() => ({ success: true }))
          .catch(() => ({ success: false }))
      );

      const results = await Promise.allSettled(promises);
      
      const stats = {
        success: results.filter(r => r.status === 'fulfilled' && r.value.success).length,
        failed: results.filter(r => r.status === 'rejected' || !r.value.success).length,
      };

      logger.info('Push masivo completado via SNS', { 
        ...stats, 
        total: endpointArns.length, 
        title 
      });
      
      return stats;
    } catch (error) {
      logger.error('Error al enviar push masivo via SNS', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Envía un SMS a un número de teléfono
   * @param {string} phoneNumber - Número de teléfono en formato +56912345678
   * @param {string} message - Mensaje de texto
   */
  async enviarSMS(phoneNumber, message) {
    try {
      const params = {
        Message: message,
        PhoneNumber: phoneNumber,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional',
          },
        },
      };

      const command = new PublishCommand(params);
      const response = await this.client.send(command);
      
      logger.info('SMS enviado exitosamente via SNS', { phoneNumber });
      return response;
    } catch (error) {
      logger.error('Error al enviar SMS via SNS', { 
        error: error.message, 
        phoneNumber 
      });
      throw AppError.internal('Error al enviar SMS');
    }
  }
}

module.exports = new SNSClientWrapper();