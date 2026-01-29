'use strict';

const sesClient = require('../../infrastructure/external/ses.client');
const snsClient = require('../../infrastructure/external/sns.client');
const notificationRepo = require('../../infrastructure/database/repositories/notification.repository');
const userPushTokenRepo = require('../../infrastructure/database/repositories/userPushToken.repository');
const userNotificationPreferenceRepo = require('../../infrastructure/database/repositories/userNotificationPreference.repository');
const TemplateRenderer = require('../../utils/templateRenderer.util');
const RateLimiter = require('../../utils/rateLimiter.util');
const { logger } = require('@abundbank/shared');

/**
 * Servicio para entrega de notificaciones
 * Responsabilidad: Enviar notificaciones por push y email
 */
class NotificationDeliveryService {
  /**
   * Envía push notification a una persona
   * @param {string} personId
   * @param {string} title
   * @param {string} body
   * @param {Object} metadata
   * @param {string} notificationId
   * @returns {Promise<{success: boolean, tokensUsed: number}>}
   */
  async enviarPushAPerson(personId, title, body, metadata, notificationId) {
    try {
      const tokens = await userPushTokenRepo.findActiveByPerson(personId);

      if (tokens.length === 0) {
        logger.warn('Persona sin tokens push activos', { personId });
        return { success: false, tokensUsed: 0 };
      }

      const promises = tokens.map(tokenData =>
        snsClient.enviarPushIndividual(tokenData.token, title, body, metadata)
          .then(() => ({ success: true }))
          .catch(err => {
            logger.error('Error enviando a token específico', {
              error: err.message,
              token: tokenData.token.substring(0, 20) + '...'
            });
            return { success: false };
          })
      );

      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => 
        r.status === 'fulfilled' && r.value.success
      ).length;

      if (successCount > 0) {
        await notificationRepo.markPushSent(notificationId);
        logger.info('Push enviado a persona', { 
          personId, 
          successCount, 
          totalTokens: tokens.length 
        });
        
        return { success: true, tokensUsed: successCount };
      } else {
        await notificationRepo.recordPushError(
          notificationId, 
          'Todos los envíos fallaron'
        );
        
        return { success: false, tokensUsed: 0 };
      }
    } catch (error) {
      logger.error('Error al enviar push a persona', { 
        error: error.message, 
        personId 
      });
      await notificationRepo.recordPushError(notificationId, error.message);
      
      return { success: false, tokensUsed: 0 };
    }
  }

  /**
   * Envía email a una persona usando templates
   * @param {string} personId
   * @param {Object} notificationType - Objeto completo con templates
   * @param {Object} metadata - Datos para templates
   * @param {string} notificationId
   * @param {string} email - Email opcional (si no se pasa, se obtiene de Person)
   * @returns {Promise<{success: boolean}>}
   */
  async enviarEmailAPerson(personId, notificationType, metadata, notificationId, email = null) {
    try {
      // Si no se proporciona email, obtenerlo desde Person
      let destinatario = email;
      
      if (!destinatario) {
        // Aquí necesitarías obtener el email desde el repository de Person
        // Por ahora asumimos que se pasa como parámetro
        const personRepo = require('../../../kyc/repositories/person.repository');
        const person = await personRepo.findById(personId, {
          include: [{ association: 'contact' }]
        });

        if (!person || !person.contact?.email) {
          logger.warn('Persona sin email', { personId });
          return { success: false };
        }

        destinatario = person.contact.email;
      }

      // Validar que soporte email
      if (!notificationType.supports_email) {
        logger.warn('Tipo de notificación no soporta email', { 
          notificationType: notificationType.code 
        });
        return { success: false };
      }

      // Validar templates
      if (!notificationType.email_subject_template || !notificationType.email_body_template) {
        logger.error('Tipo de notificación sin templates de email', {
          notificationType: notificationType.code
        });
        return { success: false };
      }

      // Generar contenido desde templates
      const asunto = TemplateRenderer.render(
        notificationType.email_subject_template, 
        metadata
      );
      const cuerpoHtml = TemplateRenderer.render(
        notificationType.email_body_template, 
        metadata
      );

      // Enviar email
      await sesClient.enviarEmail(destinatario, asunto, cuerpoHtml);
      await notificationRepo.markEmailSent(notificationId);

      logger.info('Email enviado a persona', { personId, email: destinatario });
      
      return { success: true };
    } catch (error) {
      logger.error('Error al enviar email a persona', { 
        error: error.message, 
        personId 
      });
      await notificationRepo.recordEmailError(notificationId, error.message);
      
      return { success: false };
    }
  }

  /**
   * Envía push a múltiples personas con rate limiting
   * @param {Array<Object>} persons - Array de objetos person con sus datos
   * @param {string} title
   * @param {string} body
   * @param {Object} metadata
   * @param {string} notificationTypeCode
   * @param {Object} cache - Redis cache
   * @returns {Promise<{success: number, failed: number}>}
   */
  async enviarPushMasivo(persons, title, body, metadata, notificationTypeCode, cache) {
    try {
      // Filtrar personas que permiten push
      const personsAllowingPush = [];

      for (const person of persons) {
        const allowsPush = await userNotificationPreferenceRepo.personAllowsPush(
          person.id,
          notificationTypeCode
        );
        if (allowsPush) {
          personsAllowingPush.push(person);
        }
      }

      logger.info('Personas que permiten push', {
        total: persons.length,
        allowing: personsAllowingPush.length
      });

      if (personsAllowingPush.length === 0) {
        return { success: 0, failed: 0 };
      }

      // Obtener todos los tokens activos
      const personIds = personsAllowingPush.map(p => p.id);
      const allTokens = await userPushTokenRepo.findActiveByPersons(personIds);

      if (allTokens.length === 0) {
        logger.warn('No hay tokens activos para push masivo');
        return { success: 0, failed: 0 };
      }

      const batchSize = 100;
      const totalBatches = Math.ceil(allTokens.length / batchSize);

      let totalSuccess = 0;
      let totalFailed = 0;

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = start + batchSize;
        const batch = allTokens.slice(start, end);
        const endpointArns = batch.map(t => t.token);

        // Rate limiting
        await RateLimiter.checkSNSRateLimit(cache, endpointArns.length);

        logger.info(`Procesando lote push ${i + 1}/${totalBatches}`, {
          tokensEnLote: endpointArns.length
        });

        // Enviar lote
        const stats = await snsClient.enviarPushMasivo(endpointArns, title, body, metadata);

        totalSuccess += stats.success;
        totalFailed += stats.failed;

        // Pausa entre lotes
        if (i < totalBatches - 1) {
          await RateLimiter.sleep(1000);
        }
      }

      logger.info('Push masivo completado', {
        totalTokens: allTokens.length,
        success: totalSuccess,
        failed: totalFailed
      });

      return { success: totalSuccess, failed: totalFailed };
    } catch (error) {
      logger.error('Error en push masivo', { error: error.message });
      throw error;
    }
  }

  /**
   * Envía email a múltiples personas con rate limiting
   * @param {Array<Object>} persons - Array de objetos person con contact.email
   * @param {Object} notificationType
   * @param {Object} metadata
   * @param {string} notificationTypeCode
   * @param {Object} cache
   * @returns {Promise<{success: number, failed: number}>}
   */
  async enviarEmailMasivo(persons, notificationType, metadata, notificationTypeCode, cache) {
    try {
      // Filtrar personas que permiten email y tienen email
      const personsAllowingEmail = [];

      for (const person of persons) {
        const allowsEmail = await userNotificationPreferenceRepo.personAllowsEmail(
          person.id,
          notificationTypeCode
        );
        if (allowsEmail && person.contact?.email) {
          personsAllowingEmail.push(person);
        }
      }

      logger.info('Personas que permiten email', {
        total: persons.length,
        allowing: personsAllowingEmail.length
      });

      if (personsAllowingEmail.length === 0) {
        return { success: 0, failed: 0 };
      }

      // Generar contenido desde templates
      const asunto = TemplateRenderer.render(
        notificationType.email_subject_template, 
        metadata
      );
      const cuerpoHtml = TemplateRenderer.render(
        notificationType.email_body_template, 
        metadata
      );

      const batchSize = 50;
      const totalBatches = Math.ceil(personsAllowingEmail.length / batchSize);

      let totalSuccess = 0;
      let totalFailed = 0;

      for (let i = 0; i < totalBatches; i++) {
        const start = i * batchSize;
        const end = start + batchSize;
        const batch = personsAllowingEmail.slice(start, end);

        // Rate limiting
        await RateLimiter.checkSESRateLimit(cache, batch.length);

        logger.info(`Procesando lote email ${i + 1}/${totalBatches}`, {
          emailsEnLote: batch.length
        });

        // Enviar emails del lote
        const promises = batch.map(person =>
          sesClient.enviarEmail(person.contact.email, asunto, cuerpoHtml)
            .then(() => ({ success: true }))
            .catch(err => {
              logger.error('Error enviando email', {
                error: err.message,
                email: person.contact.email
              });
              return { success: false };
            })
        );

        const results = await Promise.allSettled(promises);
        const successCount = results.filter(r => 
          r.status === 'fulfilled' && r.value.success
        ).length;
        const failedCount = batch.length - successCount;

        totalSuccess += successCount;
        totalFailed += failedCount;

        // Pausa entre lotes
        if (i < totalBatches - 1) {
          await RateLimiter.sleep(1000);
        }
      }

      logger.info('Email masivo completado', {
        totalEmails: personsAllowingEmail.length,
        success: totalSuccess,
        failed: totalFailed
      });

      return { success: totalSuccess, failed: totalFailed };
    } catch (error) {
      logger.error('Error en email masivo', { error: error.message });
      throw error;
    }
  }
}

module.exports = new NotificationDeliveryService();
