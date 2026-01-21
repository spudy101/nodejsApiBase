'use strict';

const { sequelize } = require('../../../shared/models');
const userRepository = require('../../../shared/repositories/user.repository');
const personRepository = require('../../../shared/repositories/person.repository');
const identityValidationRepository = require('../repositories/identityValidation.repository');
const AppError = require('../../../shared/utils/appError.util');
const NotificationUtil = require('../../../shared/utils/notification.util');
const ZapSignUtil = require('../utils/kycZapSign.util');
const { logger } = require('../../../shared/utils/logger.util');
const { GenerateUrlResponseDTO, WebhookResponseDTO } = require('../dtos/kycZapSign.dto');

// Mapeo de event_type a status de IdentityValidation
const ZAPSIGN_EVENT_STATUS_MAP = {
  doc_signed: 'signed',
  signer_authentication_failed: 'failed',
  doc_refused: 'cancelled',
  doc_expired: 'expired',
  doc_deleted: 'cancelled',
  // Eventos que no cambian el status
  doc_created: null,
  doc_viewed: null,
  signer_viewed: null,
};

class KycZapSignService {
  /**
   * Genera URL de ZapSign para validación de identidad
   * @param {Object} data - { fullName, channel }
   * @param {Object} metadata - { personId, userId }
   * @returns {Promise<GenerateUrlResponseDTO>}
   */
  async generateValidationUrl(data, metadata) {
    const { personId, userId } = metadata;
    const { fullName, channel = 'web' } = data;

    // 1. Verificar si ya existe validación activa (trae person y contact incluidos)
    const activeValidation = await identityValidationRepository.findActiveByPersonId(personId);

    if (activeValidation) {
      // Si está pendiente, devolver error con la URL existente
      if (activeValidation.status === 'pending') {
        throw AppError.conflict(
          'Ya tienes una validación en proceso. Completa la actual antes de solicitar una nueva.',
          {
            validation_id: activeValidation.validation_id,
            document_url: activeValidation.document_url,
            status: activeValidation.status,
          }
        );
      }

      // Si está firmada, también no permitir nueva
      if (activeValidation.status === 'signed') {
        throw AppError.conflict('Tu identidad ya fue validada exitosamente.', {
          validation_id: activeValidation.validation_id,
          status: activeValidation.status,
          completed_at: activeValidation.completed_at,
        });
      }
    }

    // 2. Obtener datos de la persona
    const person = await personRepository.findById(personId);

    if (!person) {
      throw AppError.notFound('Persona no encontrada');
    }

    // 3. Obtener email desde user repository (trae person y contact en una consulta)
    const user = await userRepository.findByUsernameAndNationalId(person.national_id);
    const email = user?.person?.contact?.email;

    // 4. Crear documento en ZapSign usando el util
    const zapSignDoc = await ZapSignUtil.createDocumentWithBiometrics(
      fullName,
      person.national_id,
      channel,
      email
    );

    // 5. Guardar validación en BD
    const validation = await identityValidationRepository.create({
      person_id: personId,
      status: 'pending',
      zapsign_document_id: zapSignDoc.token,
      zapsign_signer_token: zapSignDoc.signer.token,
      document_url: zapSignDoc.signer.sign_url,
      initiated_at: new Date(),
      attempts: 0,
    });

    // 6. Enviar notificación con el link
    if (email) {
      const timeoutMinutes = parseInt(process.env.ZAPSIGN_VALIDATION_TIMEOUT_MINUTES || '60', 10);
      
      setImmediate(() => {
        NotificationUtil.crearNotificacion({
          tipo_notificacion: 'ZAPSIGN_LINK_GENERATED',
          user_id: userId,
          metadata: {
            nombre: fullName,
            linkZapSign: zapSignDoc.signer.sign_url,
            tiempoLimite: timeoutMinutes,
          },
        }).catch((err) =>
          logger.error('Error enviando email de link ZapSign', {
            personId,
            error: err.message,
          })
        );
      });
    }

    logger.info('URL de validación generada exitosamente', {
      personId,
      userId,
      validationId: validation.validation_id,
      zapSignDocumentId: zapSignDoc.token,
      channel,
    });

    return new GenerateUrlResponseDTO(validation, zapSignDoc);
  }

  /**
   * Procesa webhook de ZapSign
   * @param {Object} webhookData - Payload completo del webhook
   * @returns {Promise<WebhookResponseDTO>}
   */
  async processWebhook(webhookData) {
    const { event_type, token: doc_token, status: doc_status, signers } = webhookData;

    // 1. Validar datos del webhook (inline)
    if (!event_type) throw AppError.badRequest('event_type es requerido en el webhook');
    if (!doc_token) throw AppError.badRequest('token del documento es requerido en el webhook');

    // 2. Buscar validación por token del documento (trae person y contact incluidos)
    const validation = await identityValidationRepository.findByZapSignDocumentId(doc_token);
    
    if (!validation) {
      logger.warn('Validación no encontrada para token', { docToken: doc_token });
      throw AppError.notFound('Validación no encontrada para este documento');
    }

    // 3. ✅ VERIFICAR SI YA FUE PROCESADA (worker o webhook anterior)
    if (validation.status !== 'pending') {
      logger.info('Validación ya procesada, ignorando webhook', {
        validationId: validation.validation_id,
        currentStatus: validation.status,
        event_type
      });
      
      return new WebhookResponseDTO({
        success: true,
        message: `Validación ya procesada con estado: ${validation.status}`,
        event_type,
        validation_id: validation.validation_id,
        current_status: validation.status,
      });
    }

    // 4. Determinar nuevo estado
    const newStatus = ZAPSIGN_EVENT_STATUS_MAP[event_type];

    if (newStatus === undefined) {
      logger.warn('event_type no reconocido', { event_type, doc_token });
      throw AppError.badRequest(`event_type no reconocido: ${event_type}`);
    }

    // 5. Si no requiere cambio de estado, solo loguear
    if (newStatus === null) {
      logger.info('Evento procesado sin cambio de estado', { event_type, doc_token });
      return new WebhookResponseDTO({
        success: true,
        message: `Evento ${event_type} procesado sin cambio de estado`,
        event_type,
        validation_id: validation.validation_id,
      });
    }

    // 6. Procesar según el nuevo estado
    const transaction = await sequelize.transaction();
    try {
      // Actualizar validación
      await identityValidationRepository.update(
        validation.validation_id,
        {
          status: newStatus,
          completed_at: new Date(),
          webhook_data: webhookData,
        },
        { transaction }
      );

      // Si fue firmado exitosamente, actualizar datos de la persona
      if (newStatus === 'signed' && signers?.[0]?.document_ocr) {
        await this._updatePersonFromOCR(validation.person_id, signers[0].document_ocr, transaction);
      }

      await transaction.commit();

      // 7. Enviar notificación según el resultado (ya tenemos person y contact en validation)
      setImmediate(() => {
        this._sendNotificationByStatus(validation, newStatus).catch((err) =>
          logger.error('Error enviando notificación de estado', {
            validationId: validation.validation_id,
            newStatus,
            error: err.message,
          })
        );
      });

      logger.info('Webhook procesado exitosamente', {
        event_type,
        validationId: validation.validation_id,
        previousStatus: validation.status,
        newStatus,
      });

      return new WebhookResponseDTO({
        success: true,
        message: `Evento ${event_type} procesado. Estado: ${newStatus}`,
        event_type,
        validation_id: validation.validation_id,
        previous_status: validation.status,
        new_status: newStatus,
      });
    } catch (error) {
      await transaction.rollback();
      logger.error('Error procesando webhook', { error: error.message, webhookData });
      throw error;
    }
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Actualiza datos de la persona desde OCR de ZapSign
   */
  async _updatePersonFromOCR(personId, ocrData, transaction) {
    const { name, last_name, date_of_birth } = ocrData;

    if (!name || !last_name) {
      logger.warn('Datos OCR incompletos', { personId, ocrData });
      return;
    }

    // Capitalizar nombres y apellidos
    const nombres = name.split(' ').map(this._capitalize);
    const apellidos = last_name.split(' ').map(this._capitalize);

    const updateData = {
      first_name: nombres[0] || null,
      last_name: apellidos[0] || null,
      birth_date: date_of_birth || null,
    };

    await personRepository.update(personId, updateData, { transaction });

    logger.info('Persona actualizada con datos OCR', {
      personId,
      firstName: updateData.first_name,
      lastName: updateData.last_name,
    });
  }

  /**
   * Envía notificación según el estado de la validación
   * @param {IdentityValidation} validation - Validación con person y contact incluidos
   * @param {string} status - Nuevo estado
   */
  async _sendNotificationByStatus(validation, status) {
    // ✅ Ya tenemos person y contact incluidos desde el repository
    if (!validation.person?.contact?.email) {
      logger.warn('No se puede enviar notificación, email no encontrado', { 
        personId: validation.person_id 
      });
      return;
    }

    const email = validation.person.contact.email;
    const nombre = validation.person?.first_name || 'Usuario';

    // Obtener user_id desde userRepository (solo cuando sea necesario enviar notificación)
    const user = await userRepository.findByUsernameAndNationalId(validation.person.national_id);
    
    if (!user) {
      logger.warn('Usuario no encontrado para notificación', { 
        personId: validation.person_id 
      });
      return;
    }

    // Enviar notificación solo para estados importantes
    switch (status) {
      case 'signed':
        await NotificationUtil.crearNotificacion({
          tipo_notificacion: 'IDENTITY_VERIFIED',
          user_id: user.user_id,
          email,
          metadata: { nombre },
        });
        logger.info('Notificación de identidad verificada enviada', { 
          personId: validation.person_id 
        });
        break;

      case 'cancelled':
        await NotificationUtil.crearNotificacion({
          tipo_notificacion: 'ZAPSIGN_CONTRACT_DELETED',
          user_id: user.user_id,
          email,
          metadata: { nombre },
        });
        logger.info('Notificación de contrato cancelado enviada', { 
          personId: validation.person_id 
        });
        break;

      case 'failed':
        await NotificationUtil.crearNotificacion({
          tipo_notificacion: 'IDENTITY_VALIDATION_FAILED',
          user_id: user.user_id,
          email,
          metadata: { nombre },
        });
        logger.info('Notificación de contrato fallido enviada', { 
          personId: validation.person_id 
        });
        break;

      case 'expired':
        // Ya se maneja en el worker
        logger.info('Link de validación expiró', { personId: validation.person_id });
        break;

      default:
        logger.debug('No se requiere notificación para este estado', { 
          personId: validation.person_id, 
          status 
        });
    }
  }

  /**
   * Capitaliza texto (primera letra mayúscula, resto minúsculas)
   */
  _capitalize(str) {
    if (!str) return null;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}

module.exports = new KycZapSignService();