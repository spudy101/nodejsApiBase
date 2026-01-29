'use strict';

const { BaseRepository } = require('@abundbank/shared');
const { Notification } = require('../index');
const { Op } = require('sequelize');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  /**
   * INCLUDES PREDEFINIDOS para evitar múltiples queries
   */
  static get INCLUDES() {
    return {
      basic: [
        { association: 'notificationType' }
      ],
      // Agregar más includes según necesites
    };
  }

  /**
   * Obtiene notificaciones de una persona con paginación
   * @param {string} personId - ID de la persona (antes era userId)
   * @param {Object} paginationParams - { page, limit, offset, sortBy, order }
   * @param {Object} searchConfig - { searchTerm, searchFields } (opcional)
   * @returns {Promise<{ rows: Array, count: number }>}
   */
  async findByPersonPaginated(personId, paginationParams = {}, searchConfig = {}) {
    const criteria = { person_id: personId };

    const options = {
      include: NotificationRepository.INCLUDES.basic
    };

    return await super.findAllPaginated(criteria, paginationParams, searchConfig, options);
  }

  /**
   * Cuenta notificaciones no leídas de una persona
   * @param {string} personId
   * @returns {Promise<number>}
   */
  async countUnreadByPerson(personId) {
    return await this.count({ person_id: personId, is_read: false });
  }

  /**
   * Marca una notificación como leída
   * @param {string} notificationId
   * @returns {Promise<Object>}
   */
  async markAsRead(notificationId) {
    return await this.update(notificationId, {
      is_read: true,
      read_at: new Date()
    });
  }

  /**
   * Marca todas las notificaciones de una persona como leídas
   * @param {string} personId
   * @returns {Promise<number>}
   */
  async markAllAsReadByPerson(personId) {
    return await this.bulkUpdate(
      { is_read: true, read_at: new Date() },
      { person_id: personId, is_read: false }
    );
  }

  /**
   * Obtiene notificaciones pendientes de envío de push
   * @returns {Promise<Array>}
   */
  async findPendingPushRetries() {
    return await this.findAll(
      {
        push_sent: false,
        push_next_retry_at: { [Op.lte]: new Date() },
        push_retry_count: { [Op.lt]: 3 }
      },
      {
        include: NotificationRepository.INCLUDES.basic
      }
    );
  }

  /**
   * Obtiene notificaciones pendientes de envío de email
   * @returns {Promise<Array>}
   */
  async findPendingEmailRetries() {
    return await this.findAll(
      {
        email_sent: false,
        email_next_retry_at: { [Op.lte]: new Date() },
        email_retry_count: { [Op.lt]: 3 }
      },
      {
        include: NotificationRepository.INCLUDES.basic
      }
    );
  }

  /**
   * Obtiene notificaciones programadas listas para enviar
   * @returns {Promise<Array>}
   */
  async findScheduledReady() {
    return await this.findAll(
      {
        processing_status: 'pending',
        scheduled_for: { [Op.lte]: new Date() }
      },
      {
        include: NotificationRepository.INCLUDES.basic
      }
    );
  }

  /**
   * Actualiza estado de procesamiento
   * @param {string} notificationId
   * @param {string} status - 'pending', 'processing', 'completed', 'failed'
   * @returns {Promise<Object>}
   */
  async updateProcessingStatus(notificationId, status) {
    return await this.update(notificationId, {
      processing_status: status
    });
  }

  /**
   * Marca push como enviado exitosamente
   * @param {string} notificationId
   * @returns {Promise<Object>}
   */
  async markPushSent(notificationId) {
    return await this.update(notificationId, {
      push_sent: true,
      push_sent_at: new Date(),
      push_error: null
    });
  }

  /**
   * Registra error en push
   * @param {string} notificationId
   * @param {string} error
   * @param {Date} nextRetryAt
   * @returns {Promise<Object>}
   */
  async recordPushError(notificationId, error, nextRetryAt = null) {
    const notification = await this.findById(notificationId);
    
    return await this.update(notificationId, {
      push_error: error,
      push_retry_count: notification.push_retry_count + 1,
      push_next_retry_at: nextRetryAt || new Date(Date.now() + 15 * 60 * 1000)
    });
  }

  /**
   * Marca email como enviado exitosamente
   * @param {string} notificationId
   * @returns {Promise<Object>}
   */
  async markEmailSent(notificationId) {
    return await this.update(notificationId, {
      email_sent: true,
      email_sent_at: new Date(),
      email_error: null
    });
  }

  /**
   * Registra error en email
   * @param {string} notificationId
   * @param {string} error
   * @param {Date} nextRetryAt
   * @returns {Promise<Object>}
   */
  async recordEmailError(notificationId, error, nextRetryAt = null) {
    const notification = await this.findById(notificationId);
    
    return await this.update(notificationId, {
      email_error: error,
      email_retry_count: notification.email_retry_count + 1,
      email_next_retry_at: nextRetryAt || new Date(Date.now() + 30 * 60 * 1000)
    });
  }

  /**
   * Obtiene notificaciones recientes de una persona (últimas 24h)
   * @param {string} personId
   * @param {number} hours
   * @returns {Promise<Array>}
   */
  async findRecentByPerson(personId, hours = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return await this.findAll(
      { 
        person_id: personId,
        created_at: { [Op.gte]: cutoffDate }
      },
      { 
        order: [['created_at', 'DESC']],
        include: NotificationRepository.INCLUDES.basic
      }
    );
  }

  /**
   * Elimina notificaciones antiguas ya leídas (limpieza)
   * @param {number} daysOld
   * @returns {Promise<number>}
   */
  async deleteOldRead(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.bulkDelete({
      is_read: true,
      read_at: { [Op.lt]: cutoffDate }
    });
  }

  /**
   * Actualiza scheduled_for (para quiet hours)
   * @param {string} notificationId
   * @param {Date} scheduledFor
   * @returns {Promise<Object>}
   */
  async updateScheduledFor(notificationId, scheduledFor) {
    return await this.update(notificationId, {
      scheduled_for: scheduledFor
    });
  }
}

module.exports = new NotificationRepository();
