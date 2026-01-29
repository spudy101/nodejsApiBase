'use strict';

const { BaseRepository } = require('@abundbank/shared');
const { GlobalNotification, GlobalNotificationRead } = require('../index');
const { Op } = require('sequelize');

class GlobalNotificationRepository extends BaseRepository {
  constructor() {
    super(GlobalNotification);
  }

  /**
   * INCLUDES PREDEFINIDOS
   */
  static get INCLUDES() {
    return {
      basic: [
        { association: 'notificationType' }
      ],
      withReads: [
        { association: 'notificationType' },
        { association: 'reads' }
      ],
    };
  }

  /**
   * Obtiene notificaciones globales activas para mostrar a usuarios
   * @returns {Promise<Array>}
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
        include: GlobalNotificationRepository.INCLUDES.basic
      }
    );
  }

  /**
   * Obtiene notificaciones activas que una persona NO ha leído
   * @param {string} personId - ID de la persona (antes era userId)
   * @returns {Promise<Array>}
   */
  async findUnreadByPerson(personId) {
    const now = new Date();
    
    // Subquery para excluir las ya leídas
    const readIds = await GlobalNotificationRead.findAll({
      where: { person_id: personId },
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
        include: GlobalNotificationRepository.INCLUDES.basic
      }
    );
  }

  /**
   * Marca una notificación global como leída para una persona
   * @param {string} globalNotificationId
   * @param {string} personId
   * @returns {Promise<Object>}
   */
  async markAsReadByPerson(globalNotificationId, personId) {
    const [record, created] = await GlobalNotificationRead.findOrCreate({
      where: {
        global_notification_id: globalNotificationId,
        person_id: personId
      },
      defaults: {
        global_notification_id: globalNotificationId,
        person_id: personId,
        read_at: new Date()
      }
    });

    return record;
  }

  /**
   * Obtiene notificaciones pendientes de procesar para push
   * @returns {Promise<Array>}
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
   * @returns {Promise<Array>}
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
   * @param {string} globalNotificationId
   * @param {string} status - 'pending', 'processing', 'completed', 'failed'
   * @param {Object} additionalData
   * @returns {Promise<Object>}
   */
  async updatePushProcessingStatus(globalNotificationId, status, additionalData = {}) {
    return await this.update(globalNotificationId, {
      push_processing_status: status,
      ...additionalData
    });
  }

  /**
   * Actualiza estado de procesamiento de email
   * @param {string} globalNotificationId
   * @param {string} status - 'pending', 'processing', 'completed', 'failed'
   * @param {Object} additionalData
   * @returns {Promise<Object>}
   */
  async updateEmailProcessingStatus(globalNotificationId, status, additionalData = {}) {
    return await this.update(globalNotificationId, {
      email_processing_status: status,
      ...additionalData
    });
  }

  /**
   * Incrementa contador de push enviados
   * @param {string} globalNotificationId
   * @param {number} amount
   * @returns {Promise}
   */
  async incrementPushSentCount(globalNotificationId, amount = 1) {
    return await this.model.increment(
      'push_sent_count',
      {
        by: amount,
        where: { id: globalNotificationId }
      }
    );
  }

  /**
   * Incrementa contador de emails enviados
   * @param {string} globalNotificationId
   * @param {number} amount
   * @returns {Promise}
   */
  async incrementEmailSentCount(globalNotificationId, amount = 1) {
    return await this.model.increment(
      'email_sent_count',
      {
        by: amount,
        where: { id: globalNotificationId }
      }
    );
  }

  /**
   * Obtiene estadísticas de una notificación global
   * @param {string} globalNotificationId
   * @returns {Promise<Object|null>}
   */
  async getStatistics(globalNotificationId) {
    const notification = await this.findById(globalNotificationId);
    if (!notification) return null;

    // Contar lecturas
    const readCount = await GlobalNotificationRead.count({
      where: { global_notification_id: globalNotificationId }
    });

    return {
      id: globalNotificationId,
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
   * @returns {Promise<number>}
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
   * Obtiene notificaciones creadas por una persona
   * @param {string} creatorId - person_id del creador
   * @returns {Promise<Array>}
   */
  async findByCreator(creatorId) {
    return await this.findAll(
      { created_by: creatorId },
      {
        order: [['created_at', 'DESC']],
        include: GlobalNotificationRepository.INCLUDES.basic
      }
    );
  }

  /**
   * Obtiene notificaciones por rol objetivo
   * @param {string} role
   * @returns {Promise<Array>}
   */
  async findByTargetRole(role) {
    return await this.findAll(
      { target_user_role: role, is_active: true },
      { order: [['created_at', 'DESC']] }
    );
  }
}

module.exports = new GlobalNotificationRepository();
