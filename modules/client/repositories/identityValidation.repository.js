'use strict';

const BaseRepository = require('../../../shared/repositories/base.repository');
const { IdentityValidation } = require('../../../shared/models');
const { Op } = require('sequelize');

class IdentityValidationRepository extends BaseRepository {
  constructor() {
    super(IdentityValidation);
  }

  // Includes predefinidos para reutilización
  static INCLUDES = {
    withPerson: [
      {
        association: 'person',
        include: [
          { association: 'contact' }
        ],
      }
    ],
  };

  /**
   * Busca una validación activa (pending o signed) por person_id
   * Incluye datos de person y contact para evitar consultas adicionales
   * @param {string} personId - UUID de la persona
   * @returns {Promise<IdentityValidation|null>}
   */
  async findActiveByPersonId(personId) {
    return await this.findOne(
      {
        person_id: personId,
        status: ['pending', 'signed'],
      },
      {
        include: IdentityValidationRepository.INCLUDES.withPerson,
        order: [['created_at', 'DESC']],
      }
    );
  }

  /**
   * Busca validación por token del documento de ZapSign
   * Incluye datos de person y contact para evitar consultas adicionales en webhook
   * @param {string} zapSignDocumentId - Token del documento en ZapSign
   * @returns {Promise<IdentityValidation|null>}
   */
  async findByZapSignDocumentId(zapSignDocumentId) {
    return await this.findOne(
      {
        zapsign_document_id: zapSignDocumentId,
      },
      {
        include: IdentityValidationRepository.INCLUDES.withPerson,
      }
    );
  }

  /**
   * Busca la última validación de una persona (cualquier estado)
   * @param {string} personId - UUID de la persona
   * @returns {Promise<IdentityValidation|null>}
   */
  async findLatestByPersonId(personId) {
    return await this.findOne(
      { person_id: personId },
      {
        order: [['created_at', 'DESC']],
      }
    );
  }

  /**
   * Busca validaciones pendientes que iniciaron antes de una fecha
   * Incluye person y contact para enviar notificaciones sin consultas adicionales
   * @param {Date} beforeDate - Fecha límite
   * @returns {Promise<Array<IdentityValidation>>}
   */
  async findPendingBeforeDate(beforeDate) {
    return await this.findAll(
      {
        status: 'pending',
        initiated_at: {
          [Op.lte]: beforeDate
        }
      },
      {
        include: IdentityValidationRepository.INCLUDES.withPerson,
      }
    );
  }

  /**
   * Marca una validación como completada con un estado final
   * @param {string} validationId - UUID de la validación
   * @param {string} status - Estado final (signed, cancelled, failed, expired)
   * @param {Object} webhookData - Datos del webhook
   * @param {string|null} errorMessage - Mensaje de error (opcional)
   * @returns {Promise<IdentityValidation>}
   */
  async markAsCompleted(validationId, status, webhookData = null, errorMessage = null) {
    const updateData = {
      status,
      completed_at: new Date(),
    };

    if (webhookData) {
      updateData.webhook_data = webhookData;
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    return await this.update(validationId, updateData);
  }

  /**
   * Incrementa el contador de intentos
   * @param {string} validationId - UUID de la validación
   * @returns {Promise<IdentityValidation>}
   */
  async incrementAttempts(validationId) {
    const validation = await this.findById(validationId);
    
    if (!validation) {
      throw new Error('Validación no encontrada');
    }

    return await this.update(validationId, {
      attempts: validation.attempts + 1,
      last_attempt_at: new Date(),
    });
  }

  /**
   * Verifica si existe una validación activa para una persona
   * @param {string} personId - UUID de la persona
   * @returns {Promise<boolean>}
   */
  async hasActiveValidation(personId) {
    return await this.exists({
      person_id: personId,
      status: ['pending', 'signed'],
    });
  }
}

module.exports = new IdentityValidationRepository();