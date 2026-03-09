'use strict';

const {
  SNSClient,
  CreatePlatformEndpointCommand,
  DeleteEndpointCommand,
  PublishCommand,
} = require('@aws-sdk/client-sns');
const { logger }           = require('../../../../shared/utils/logger.util');
const AppError             = require('../../../../shared/utils/app-error.util');
const { notifications, aws } = require('../../../../shared/constants');

class PushNotificationService {
  constructor() {
    this.snsClient = new SNSClient({
      region: aws.region,
      credentials: {
        accessKeyId:     aws.accessKeyId,
        secretAccessKey: aws.secretAccessKey,
      },
    });

    this.PLATFORM_ARNS = {
      ios:     notifications.sns.platformArnIos,
      android: notifications.sns.platformArnAndroid,
    };
  }

  /**
   * Registra un dispositivo para recibir push notifications
   * @param {string} deviceToken - Token del dispositivo
   * @param {string} platform    - 'ios' o 'android'
   * @param {string} userId      - ID del usuario
   * @returns {Promise<string>} EndpointArn
   */
  async registrarDispositivo(deviceToken, platform, userId) {
    try {
      const platformArn = this.PLATFORM_ARNS[platform.toLowerCase()];

      if (!platformArn) {
        throw AppError.badRequest(`Plataforma no soportada: ${platform}`);
      }

      const command  = new CreatePlatformEndpointCommand({
        PlatformApplicationArn: platformArn,
        Token:          deviceToken,
        CustomUserData: userId,
      });
      const response = await this.snsClient.send(command);

      logger.info('Dispositivo registrado exitosamente', {
        userId,
        platform,
        endpointArn: response.EndpointArn,
      });

      return response.EndpointArn;
    } catch (error) {
      logger.error('Error al registrar dispositivo', { error: error.message, userId, platform });
      throw AppError.internal('Error al registrar dispositivo para notificaciones');
    }
  }

  /**
   * Elimina un endpoint de SNS (desregistrar dispositivo)
   * @param {string} endpointArn - ARN del endpoint a eliminar
   */
  async eliminarDispositivo(endpointArn) {
    try {
      await this.snsClient.send(new DeleteEndpointCommand({ EndpointArn: endpointArn }));
      logger.info('Dispositivo eliminado exitosamente', { endpointArn });
      return true;
    } catch (error) {
      logger.error('Error al eliminar dispositivo', { error: error.message, endpointArn });
      throw AppError.internal('Error al eliminar dispositivo');
    }
  }

  /**
   * Envía una notificación push a un dispositivo específico
   * @param {string} endpointArn - ARN del endpoint
   * @param {string} title       - Título de la notificación
   * @param {string} body        - Cuerpo de la notificación
   * @param {Object} data        - Datos adicionales (opcional)
   */
  async enviarPushIndividual(endpointArn, title, body, data = {}) {
    try {
      const message = this._construirMensajePush(title, body, data);

      const response = await this.snsClient.send(new PublishCommand({
        TargetArn:        endpointArn,
        Message:          JSON.stringify(message),
        MessageStructure: 'json',
      }));

      logger.info('Push individual enviado exitosamente', { endpointArn, title });
      return response;
    } catch (error) {
      logger.error('Error al enviar push individual', { error: error.message, endpointArn });
      return null;
    }
  }

  /**
   * Envía notificaciones push masivas a múltiples dispositivos
   * @param {Array<string>} endpointArns - Array de ARNs de endpoints
   * @param {string} title              - Título
   * @param {string} body               - Cuerpo
   * @param {Object} data               - Datos adicionales (opcional)
   * @returns {Promise<{ success: number, failed: number }>}
   */
  async enviarPushMasivo(endpointArns, title, body, data = {}) {
    try {
      const promises = endpointArns.map(arn =>
        this.enviarPushIndividual(arn, title, body, data)
          .then(() => ({ success: true  }))
          .catch(() => ({ success: false }))
      );

      const results = await Promise.allSettled(promises);

      const stats = {
        success: results.filter(r => r.status === 'fulfilled' && r.value.success !== false).length,
        failed:  results.filter(r => r.status === 'rejected'  || r.value.success === false).length,
      };

      logger.info('Push masivo completado', { ...stats, total: endpointArns.length, title });
      return stats;
    } catch (error) {
      logger.error('Error al enviar push masivo', { error: error.message });
      return { success: 0, failed: endpointArns.length };
    }
  }

  /**
   * Envía un SMS a un número de teléfono
   * @param {string} phoneNumber - Número en formato +56912345678
   * @param {string} message     - Mensaje de texto
   */
  async enviarSMS(phoneNumber, message) {
    try {
      const response = await this.snsClient.send(new PublishCommand({
        Message:     message,
        PhoneNumber: phoneNumber,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType:    'String',
            StringValue: 'Transactional',
          },
        },
      }));

      logger.info('SMS enviado exitosamente', { phoneNumber });
      return response;
    } catch (error) {
      logger.error('Error al enviar SMS', { error: error.message, phoneNumber });
      throw AppError.internal('Error al enviar SMS');
    }
  }

  /**
   * Construye el mensaje en formato para iOS y Android
   * @private
   */
  _construirMensajePush(title, body, data = {}) {
    return {
      default: body,
      APNS: JSON.stringify({
        aps: {
          alert: { title, body },
          sound: 'default',
          badge: 1,
        },
        data,
      }),
      GCM: JSON.stringify({
        notification: { title, body, sound: 'default' },
        data,
      }),
    };
  }
}

module.exports = new PushNotificationService();