'use strict';

const BaseRepository = require('../../../shared/repositories/base.repository');
const { GlobalNotification, GlobalNotificationRead } = require('../../../shared/models');
const { Op } = require('sequelize');

class GlobalNotificationRepository extends BaseRepository {
  constructor() {
    super(GlobalNotification);
  }

  /**
   * Obtiene notificaciones globales activas para mostrar a usuarios
   */
  async findActiveNotifications() {
    const now = new Date();
    
    return await this.findAll(
      {
        is_active: true,
        send_in_app: true,
        starts_at: { [Op.lte]: now },
        [Op.or]: [
          { ends_at: null },
          { ends_at: { [Op.gt]: now } }
        ]
      },
      {
        order: [['created_at', 'DESC']],
        include: [{ association: 'notificationType' }]
      }
    );
  }

  /**
   * Obtiene notificaciones activas que un usuario NO ha leído
   */
  async findUnreadByUser(userId) {
    const now = new Date();
    const { sequelize } = this.model;
    
    // Subquery para excluir las ya leídas
    const readIds = await GlobalNotificationRead.findAll({
      where: { user_id: userId },
      attributes: ['global_notification_id'],
      raw: true
    });

    const readIdsArray = readIds.map(r => r.global_notification_id);

    return await this.findAll(
      {
        is_active: true,
        send_in_app: true,
        starts_at: { [Op.lte]: now },
        [Op.or]: [
          { ends_at: null },
          { ends_at: { [Op.gt]: now } }
        ],
        id: { [Op.notIn]: readIdsArray.length > 0 ? readIdsArray : ['00000000-0000-0000-0000-000000000000'] }
      },
      {
        order: [['created_at', 'DESC']],
        include: [{ association: 'notificationType' }]
      }
    );
  }

  /**
   * Marca una notificación global como leída para un usuario
   */
  async markAsReadByUser(globalNotificationId, userId) {
    const [record, created] = await GlobalNotificationRead.findOrCreate({
      where: {
        global_notification_id: globalNotificationId,
        user_id: userId
      },
      defaults: {
        global_notification_id: globalNotificationId,
        user_id: userId,
        read_at: new Date()
      }
    });

    return record;
  }

  /**
   * Obtiene notificaciones pendientes de procesar para push
   */
  async findPendingPushProcessing() {
    return await this.findAll({
      send_push: true,
      push_processing_status: 'pending',
      is_active: true
    });
  }

  /**
   * Obtiene notificaciones pendientes de procesar para email
   */
  async findPendingEmailProcessing() {
    return await this.findAll({
      send_email: true,
      email_processing_status: 'pending',
      is_active: true
    });
  }

  /**
   * Actualiza estado de procesamiento de push
   */
  async updatePushProcessingStatus(globalNotificationId, status, additionalData = {}) {
    return await this.update(globalNotificationId, {
      push_processing_status: status,
      ...additionalData
    });
  }

  /**
   * Actualiza estado de procesamiento de email
   */
  async updateEmailProcessingStatus(globalNotificationId, status, additionalData = {}) {
    return await this.update(globalNotificationId, {
      email_processing_status: status,
      ...additionalData
    });
  }

  /**
   * Incrementa contador de push enviados
   */
  async incrementPushSentCount(globalNotificationId, amount = 1) {
    const { sequelize } = this.model;
    
    return await this.model.increment(
      'push_sent_count',
      {
        by: amount,
        where: { global_notification_id: globalNotificationId }
      }
    );
  }

  /**
   * Incrementa contador de emails enviados
   */
  async incrementEmailSentCount(globalNotificationId, amount = 1) {
    const { sequelize } = this.model;
    
    return await this.model.increment(
      'email_sent_count',
      {
        by: amount,
        where: { global_notification_id: globalNotificationId }
      }
    );
  }

  /**
   * Obtiene estadísticas de una notificación global
   */
  async getStatistics(globalNotificationId) {
    const notification = await this.findById(globalNotificationId);
    if (!notification) return null;

    // Contar lecturas
    const readCount = await GlobalNotificationRead.count({
      where: { global_notification_id: globalNotificationId }
    });

    return {
      global_notification_id: globalNotificationId,
      total_target_users: notification.total_target_users,
      push_sent_count: notification.push_sent_count,
      email_sent_count: notification.email_sent_count,
      read_count: readCount,
      push_processing_status: notification.push_processing_status,
      email_processing_status: notification.email_processing_status,
      is_active: notification.is_active
    };
  }

  /**
   * Desactiva notificaciones expiradas
   */
  async deactivateExpired() {
    const now = new Date();
    
    return await this.bulkUpdate(
      { is_active: false },
      {
        is_active: true,
        ends_at: { [Op.lte]: now }
      }
    );
  }

  /**
   * Obtiene notificaciones creadas por un usuario
   */
  async findByCreator(creatorId) {
    return await this.findAll(
      { created_by: creatorId },
      {
        order: [['created_at', 'DESC']],
        include: [{ association: 'notificationType' }]
      }
    );
  }

  /**
   * Obtiene notificaciones por rol objetivo
   */
  async findByTargetRole(role) {
    return await this.findAll(
      { target_user_role: role, is_active: true },
      { order: [['created_at', 'DESC']] }
    );
  }
}

module.exports = new GlobalNotificationRepository();