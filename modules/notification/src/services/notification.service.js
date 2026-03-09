'use strict';

const { Op }                         = require('sequelize');
const { sequelize }                  = require('../../../../shared/models');
const notificationRepository         = require('../../repositories/notification.repository');
const globalNotificationRepository   = require('../../repositories/global-notification.repository');
const globalNotificationReadRepository = require('../../repositories/global-notification-read.repository');
const notificationCreationService    = require('./notification-creation.service');
const { MetadataDTO }                = require('../../../../shared/dtos/components.dto');
const { logger }                     = require('../../../../shared/utils/logger.util');

class NotificationService {

  /**
   * Obtiene notificaciones mezcladas (personal + global) con paginación
   * @param {string} userId
   * @param {Object} query
   */
  async getNotificationsList(userId, query) {
    const { page = 1, limit = 10, sortBy = 'created_at', order = 'DESC' } = query;
    const offset = (page - 1) * limit;

    const personalNotifications = await this._getPersonalNotificationsRaw(userId);
    const globalNotifications   = await this._getGlobalNotificationsRaw(userId);

    const allNotifications = this._mergeAndSortNotifications(
      personalNotifications,
      globalNotifications,
      sortBy,
      order
    );

    const totalItems    = allNotifications.length;
    const paginatedData = allNotifications.slice(offset, offset + limit);

    await this._markPageAsRead(userId, paginatedData);

    const metadata = MetadataDTO.build({ totalItems, page, limit, sortBy, order });

    return { data: paginatedData, metadata };
  }

  /**
   * Obtiene solo notificaciones personales con paginación
   * @param {string} userId
   * @param {Object} query
   */
  async getPersonalNotifications(userId, query) {
    const { page = 1, limit = 10, sortBy = 'created_at', order = 'DESC', search } = query;
    const offset = (page - 1) * limit;

    const result = await notificationRepository.findByUserPaginated(
      userId,
      { page, limit, offset, sortBy, order },
      { searchTerm: search, searchFields: ['title', 'body'] }
    );

    const notificationIds = result.rows
      .filter(n => !n.is_read)
      .map(n => n.notification_id);

    if (notificationIds.length > 0) {
      await this._markPersonalAsRead(notificationIds);
    }

    const data     = result.rows.map(n => this._mapPersonalNotification(n));
    const metadata = MetadataDTO.build({
      totalItems: result.count,
      page,
      limit,
      sortBy,
      order,
    });

    return { data, metadata };
  }

  /**
   * Obtiene solo notificaciones globales con paginación
   * @param {string} userId
   * @param {Object} query
   */
  async getGlobalNotifications(userId, query) {
    const { page = 1, limit = 10, sortBy = 'created_at', order = 'DESC' } = query;
    const offset = (page - 1) * limit;

    const allGlobals    = await this._getGlobalNotificationsRaw(userId);
    const totalItems    = allGlobals.length;
    const paginatedData = allGlobals.slice(offset, offset + limit);

    const globalIds = paginatedData
      .filter(n => !n.is_read)
      .map(n => n.notification_id);

    if (globalIds.length > 0) {
      await globalNotificationReadRepository.bulkMarkAsRead(globalIds, userId);
    }

    const metadata = MetadataDTO.build({ totalItems, page, limit, sortBy, order });

    return { data: paginatedData, metadata };
  }

  /**
   * Obtiene el contador total de notificaciones no leídas (personal + global)
   * @param {string} userId
   */
  async getUnreadCount(userId) {
    const personalCount = await notificationRepository.countUnreadByUser(userId);
    const globalUnread  = await globalNotificationRepository.findUnreadByUser(userId);

    return personalCount + globalUnread.length;
  }

  /**
   * Crea una notificación (wrapper del service de creación)
   */
  async createNotification(data, metadata) {
    return await notificationCreationService.crearNotificacion(data, metadata.transaction);
  }

  /**
   * Crea una notificación directa por email
   */
  async createDirectNotification(data) {
    return await notificationCreationService.crearNotificacionDirecta(data);
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  /** @private */
  async _getPersonalNotificationsRaw(userId) {
    const notifications = await notificationRepository.findAll(
      { user_id: userId },
      {
        order:   [['created_at', 'DESC']],
        include: [{ association: 'notificationType' }],
        raw:     false,
      }
    );

    return notifications.map(n => this._mapPersonalNotification(n));
  }

  /** @private */
  async _getGlobalNotificationsRaw(userId) {
    const now    = new Date();
    const readIds = await globalNotificationReadRepository.getReadIdsByUser(userId);

    const globalNotifications = await globalNotificationRepository.findAll(
      {
        is_active:  true,
        send_in_app: true,
        starts_at:  { [Op.lte]: now },
        [Op.or]: [
          { ends_at: null },
          { ends_at: { [Op.gt]: now } },
        ],
      },
      {
        order:   [['created_at', 'DESC']],
        include: [{ association: 'notificationType' }],
        raw:     false,
      }
    );

    return globalNotifications.map(n => ({
      notification_id:  n.global_notification_id,
      type:             'global',
      title:            n.title,
      body:             n.body,
      metadata:         n.metadata,
      is_read:          readIds.includes(n.global_notification_id),
      read_at:          readIds.includes(n.global_notification_id) ? new Date() : null,
      created_at:       n.createdAt,
      notification_type: n.notification_type ? {
        notification_type_id: n.notification_type.notification_type_id,
        code:                 n.notification_type.code,
        name:                 n.notification_type.name,
      } : null,
    }));
  }

  /** @private */
  _mapPersonalNotification(notification) {
    return {
      notification_id:     notification.notification_id,
      type:                'personal',
      title:               notification.title,
      body:                notification.body,
      metadata:            notification.metadata,
      is_read:             notification.is_read,
      read_at:             notification.read_at,
      created_at:          notification.createdAt || notification.created_at,
      related_entity_type: notification.related_entity_type,
      related_entity_id:   notification.related_entity_id,
      notification_type:   notification.notification_type ? {
        notification_type_id: notification.notification_type.notification_type_id,
        code:                 notification.notification_type.code,
        name:                 notification.notification_type.name,
      } : null,
    };
  }

  /** @private */
  _mergeAndSortNotifications(personal, global, sortBy = 'created_at', order = 'DESC') {
    const merged = [...personal, ...global];

    merged.sort((a, b) => {
      const aValue = a[sortBy] || a.created_at;
      const bValue = b[sortBy] || b.created_at;

      return order === 'ASC'
        ? aValue > bValue ? 1 : -1
        : aValue < bValue ? 1 : -1;
    });

    return merged;
  }

  /** @private */
  async _markPageAsRead(userId, notifications) {
    const personalIds = notifications
      .filter(n => n.type === 'personal' && !n.is_read)
      .map(n => n.notification_id);

    const globalIds = notifications
      .filter(n => n.type === 'global' && !n.is_read)
      .map(n => n.notification_id);

    if (personalIds.length === 0 && globalIds.length === 0) return;

    const transaction = await sequelize.transaction();

    try {
      if (personalIds.length > 0) {
        await this._markPersonalAsRead(personalIds, { transaction });
      }
      if (globalIds.length > 0) {
        await globalNotificationReadRepository.bulkMarkAsRead(globalIds, userId, { transaction });
      }
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      logger.error('Error marking page as read', { userId, error: error.message });
    }
  }

  /** @private */
  async _markPersonalAsRead(notificationIds, options = {}) {
    if (!notificationIds || notificationIds.length === 0) return;

    await notificationRepository.bulkUpdate(
      { is_read: true, read_at: new Date() },
      { notification_id: { [Op.in]: notificationIds } },
      options
    );
  }
}

module.exports = new NotificationService();