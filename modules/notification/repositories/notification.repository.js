'use strict';

const BaseRepository = require('../../../shared/repositories/base.repository');
const { Notification } = require('../../../shared/models');
const { Op } = require('sequelize');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  /**
   * Obtiene notificaciones de un usuario con paginación
   * @param {string} userId 
   * @param {Object} paginationParams - { page, limit, offset, sortBy, order }
   * @param {Object} searchConfig - { searchTerm, searchFields } (opcional)
   * @returns {Promise<{ rows: Array, count: number }>}
   */
  async findByUserPaginated(userId, paginationParams = {}, searchConfig = {}) {
    const criteria = { user_id: userId };

    const options = {
      include: [{ association: 'notificationType' }]
    };

    return await super.findAllPaginated(criteria, paginationParams, searchConfig, options);
  }

  /**
   * Cuenta notificaciones no leídas de un usuario
   */
  async countUnreadByUser(userId) {
    return await this.count({ user_id: userId, is_read: false });
  }

  /**
   * Marca una notificación como leída
   */
  async markAsRead(notificationId) {
    return await this.update(notificationId, {
      is_read: true,
      read_at: new Date()
    });
  }

  /**
   * Marca todas las notificaciones de un usuario como leídas
   */
  async markAllAsReadByUser(userId) {
    return await this.bulkUpdate(
      { is_read: true, read_at: new Date() },
      { user_id: userId, is_read: false }
    );
  }

  /**
   * Obtiene notificaciones pendientes de envío de push
   */
  async findPendingPushRetries() {
    return await this.findAll({
      push_sent: false,
      push_next_retry_at: { [Op.lte]: new Date() },
      push_retry_count: { [Op.lt]: 3 }
    });
  }

  /**
   * Obtiene notificaciones pendientes de envío de email
   */
  async findPendingEmailRetries() {
    return await this.findAll({
      email_sent: false,
      email_next_retry_at: { [Op.lte]: new Date() },
      email_retry_count: { [Op.lt]: 3 }
    });
  }

  /**
   * Obtiene notificaciones programadas listas para enviar
   */
  async findScheduledReady() {
    return await this.findAll({
      processing_status: 'pending',
      scheduled_for: { [Op.lte]: new Date() }
    });
  }

  /**
   * Actualiza estado de procesamiento
   */
  async updateProcessingStatus(notificationId, status) {
    return await this.update(notificationId, {
      processing_status: status
    });
  }

  /**
   * Marca push como enviado exitosamente
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
   * Obtiene notificaciones recientes de un usuario (últimas 24h)
   */
  async findRecentByUser(userId, hours = 24) {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hours);

    return await this.findAll(
      { 
        user_id: userId,
        created_at: { [Op.gte]: cutoffDate }
      },
      { order: [['created_at', 'DESC']] }
    );
  }

  /**
   * Elimina notificaciones antiguas ya leídas (limpieza)
   */
  async deleteOldRead(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.bulkDelete({
      is_read: true,
      read_at: { [Op.lt]: cutoffDate }
    });
  }
}

module.exports = new NotificationRepository();