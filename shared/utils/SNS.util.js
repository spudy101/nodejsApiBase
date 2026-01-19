'use strict';

const { 
  SNSClient, 
  CreatePlatformEndpointCommand,
  DeleteEndpointCommand,
  PublishCommand,
} = require('@aws-sdk/client-sns');
const { logger } = require('./logger.util');
const AppError = require('./appError.util');

class SNSUtil {
  static snsClient = new SNSClient({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  // ARNs de las aplicaciones de plataforma (configurar en .env)
  static PLATFORM_ARNS = {
    ios: process.env.SNS_PLATFORM_ARN_IOS,
    android: process.env.SNS_PLATFORM_ARN_ANDROID,
  };

  /**
   * Registra un dispositivo para recibir push notifications
   * @param {string} deviceToken - Token del dispositivo
   * @param {string} platform - 'ios' o 'android'
   * @param {string} userId - ID del usuario (para custom user data)
   * @returns {Promise<string>} EndpointArn
   */
  static async registrarDispositivo(deviceToken, platform, userId) {
    try {
      const platformArn = this.PLATFORM_ARNS[platform.toLowerCase()];
      
      if (!platformArn) {
        throw AppError.badRequest(`Plataforma no soportada: ${platform}`);
      }

      const params = {
        PlatformApplicationArn: platformArn,
        Token: deviceToken,
        CustomUserData: userId,
      };

      const command = new CreatePlatformEndpointCommand(params);
      const response = await this.snsClient.send(command);
      
      logger.info('Dispositivo registrado exitosamente', { userId, platform, endpointArn: response.EndpointArn });
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
  static async eliminarDispositivo(endpointArn) {
    try {
      const command = new DeleteEndpointCommand({ EndpointArn: endpointArn });
      await this.snsClient.send(command);
      
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
   * @param {string} title - Título de la notificación
   * @param {string} body - Cuerpo de la notificación
   * @param {object} data - Datos adicionales (opcional)
   */
  static async enviarPushIndividual(endpointArn, title, body, data = {}) {
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
      const response = await this.snsClient.send(command);
      
      logger.info('Push individual enviado exitosamente', { endpointArn, title });
      return response;
    } catch (error) {
      logger.error('Error al enviar push individual', { error: error.message, endpointArn });
      // No lanzar error aquí para que no bloquee el flujo principal
      return null;
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
  static async enviarPushMasivo(endpointArns, title, body, data = {}) {
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

      logger.info('Push masivo completado', { ...stats, total: endpointArns.length, title });
      return stats;
    } catch (error) {
      logger.error('Error al enviar push masivo', { error: error.message });
      throw AppError.internal('Error al enviar notificaciones masivas');
    }
  }

  /**
   * Envía un SMS a un número de teléfono
   * @param {string} phoneNumber - Número de teléfono en formato +56912345678
   * @param {string} message - Mensaje de texto
   */
  static async enviarSMS(phoneNumber, message) {
    try {
      const params = {
        Message: message,
        PhoneNumber: phoneNumber,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional', // o 'Promotional'
          },
        },
      };

      const command = new PublishCommand(params);
      const response = await this.snsClient.send(command);
      
      logger.info('SMS enviado exitosamente', { phoneNumber });
      return response;
    } catch (error) {
      logger.error('Error al enviar SMS', { error: error.message, phoneNumber });
      throw AppError.internal('Error al enviar SMS');
    }
  }
}

module.exports = SNSUtil;