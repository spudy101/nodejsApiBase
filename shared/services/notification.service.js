'use strict';

const notificationRepo = require('../repositories/notification.repository');
const globalNotificationRepo = require('../repositories/globalNotification.repository');
const globalNotificationReadRepo = require('../repositories/globalNotificationRead.repository');
const NotificationUtil = require('../utils/notification.util');
const notificationEmitter = require('../utils/notificationEmitter.util');
const PaginationHelper = require('../utils/paginationHelper.util');
const { logger } = require('../utils/logger.util');
const { sequelize } = require('../models');
const { Op } = require('sequelize');

class NotificationService {

  /**
   * Obtiene notificaciones mezcladas (personal + global) con paginación
   * @param {string} userId 
   * @param {Object} query
   * @returns {Promise<{ data: Array, metadata: Object }>}
   */
  async getNotificationsList(userId, query) {
    const paginationParams = PaginationHelper.getPaginationParams(query);
    const { page, limit, offset, sortBy, order } = paginationParams;

    const personalNotifications = await this._getPersonalNotificationsRaw(userId);
    const globalNotifications = await this._getGlobalNotificationsRaw(userId);

    const allNotifications = this._mergeAndSortNotifications(
      personalNotifications,
      globalNotifications,
      sortBy,
      order
    );

    const totalItems = allNotifications.length;
    const paginatedData = allNotifications.slice(offset, offset + limit);

    await this._markPageAsRead(userId, paginatedData);

    const metadata = PaginationHelper.buildMetadata(
      totalItems,
      page,
      limit,
      null,
      { sortBy, order }
    );

    return {
      data: paginatedData,
      metadata
    };
  }

  /**
   * Obtiene solo notificaciones personales con paginación
   * @param {string} userId 
   * @param {Object} query
   * @returns {Promise<{ data: Array, metadata: Object }>}
   */
  async getPersonalNotifications(userId, query) {
    const paginationParams = PaginationHelper.getPaginationParams(query);
    const { page, limit } = paginationParams;

    const result = await notificationRepo.findByUserPaginated(
      userId,
      paginationParams,
      { searchTerm: query.search, searchFields: ['title', 'body'] }
    );

    const notificationIds = result.rows
      .filter(n => !n.is_read)
      .map(n => n.notification_id);

    if (notificationIds.length > 0) {
      await this._markPersonalAsRead(notificationIds);
    }

    const data = result.rows.map(n => this._mapPersonalNotification(n));

    const metadata = PaginationHelper.buildMetadata(
      result.count,
      page,
      limit,
      null,
      { sortBy: paginationParams.sortBy, order: paginationParams.order }
    );

    return { data, metadata };
  }

  /**
   * Obtiene solo notificaciones globales con paginación
   * @param {string} userId 
   * @param {Object} query
   * @returns {Promise<{ data: Array, metadata: Object }>}
   */
  async getGlobalNotifications(userId, query) {
    const paginationParams = PaginationHelper.getPaginationParams(query);
    const { page, limit, offset } = paginationParams;

    const allGlobals = await this._getGlobalNotificationsRaw(userId);

    const totalItems = allGlobals.length;
    const paginatedData = allGlobals.slice(offset, offset + limit);

    const globalIds = paginatedData
      .filter(n => !n.is_read)
      .map(n => n.notification_id);

    if (globalIds.length > 0) {
      await globalNotificationReadRepo.bulkMarkAsRead(globalIds, userId);
    }

    const metadata = PaginationHelper.buildMetadata(
      totalItems,
      page,
      limit,
      null,
      { sortBy: paginationParams.sortBy, order: paginationParams.order }
    );

    return {
      data: paginatedData,
      metadata
    };
  }

  /**
   * Obtiene el contador total de notificaciones no leídas (personal + global)
   * @param {string} userId 
   * @returns {Promise<number>}
   */
  async getUnreadCount(userId) {
    const personalCount = await notificationRepo.countUnreadByUser(userId);
    const globalUnread = await globalNotificationRepo.findUnreadByUser(userId);
    const globalCount = globalUnread.length;

    return personalCount + globalCount;
  }

  /**
   * Crea una notificación (wrapper de NotificationUtil + SSE)
   * @param {Object} data
   * @param {Object} metadata
   * @returns {Promise<Object>}
   */
  async createNotification(data, metadata) {
    const result = await NotificationUtil.crearNotificacion(data, metadata.transaction);

    if (data.user_id) {
      await this._emitCountUpdate(data.user_id);
    }

    return result;
  }

  /**
   * Obtiene notificaciones personales sin paginar (raw)
   * @private
   */
  async _getPersonalNotificationsRaw(userId) {
    const notifications = await notificationRepo.findAll(
      { user_id: userId },
      {
        order: [['created_at', 'DESC']],
        include: [{ association: 'notification_type' }],
        raw: false
      }
    );

    return notifications.map(n => this._mapPersonalNotification(n));
  }

  /**
   * Obtiene notificaciones globales activas (raw)
   * @private
   */
  async _getGlobalNotificationsRaw(userId) {
    const now = new Date();

    const readIds = await globalNotificationReadRepo.getReadIdsByUser(userId);

    const globalNotifications = await globalNotificationRepo.findAll(
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
        include: [{ association: 'notification_type' }],
        raw: false
      }
    );

    return globalNotifications.map(n => ({
      notification_id: n.global_notification_id,
      type: 'global',
      title: n.title,
      body: n.body,
      metadata: n.metadata,
      is_read: readIds.includes(n.global_notification_id),
      read_at: readIds.includes(n.global_notification_id) ? new Date() : null,
      created_at: n.createdAt,
      notification_type: n.notification_type ? {
        notification_type_id: n.notification_type.notification_type_id,
        code: n.notification_type.code,
        name: n.notification_type.name
      } : null
    }));
  }

  /**
   * Mapea una notificación personal a formato de respuesta
   * @private
   */
  _mapPersonalNotification(notification) {
    return {
      notification_id: notification.notification_id,
      type: 'personal',
      title: notification.title,
      body: notification.body,
      metadata: notification.metadata,
      is_read: notification.is_read,
      read_at: notification.read_at,
      created_at: notification.createdAt || notification.created_at,
      related_entity_type: notification.related_entity_type,
      related_entity_id: notification.related_entity_id,
      notification_type: notification.notification_type ? {
        notification_type_id: notification.notification_type.notification_type_id,
        code: notification.notification_type.code,
        name: notification.notification_type.name
      } : null
    };
  }

  /**
   * Mezcla y ordena notificaciones personales y globales
   * @private
   */
  _mergeAndSortNotifications(personal, global, sortBy = 'created_at', order = 'DESC') {
    const merged = [...personal, ...global];

    merged.sort((a, b) => {
      const aValue = a[sortBy] || a.created_at;
      const bValue = b[sortBy] || b.created_at;

      if (order === 'ASC') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return merged;
  }

  /**
   * Marca como leídas las notificaciones de una página (personal y global)
   * @private
   */
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
        await globalNotificationReadRepo.bulkMarkAsRead(globalIds, userId, { transaction });
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      logger.error('Error marking page as read', { userId, error: error.message });
    }
  }

  /**
   * Marca notificaciones personales como leídas
   * @private
   */
  async _markPersonalAsRead(notificationIds, options = {}) {
    if (!notificationIds || notificationIds.length === 0) return;

    await notificationRepo.bulkUpdate(
      { is_read: true, read_at: new Date() },
      { notification_id: { [Op.in]: notificationIds } },
      options
    );
  }

  /**
   * Emite evento SSE de actualización de contador
   * @private
   */
  async _emitCountUpdate(userId) {
    try {
      const newCount = await this.getUnreadCount(userId);
      
      notificationEmitter.emit('count-updated', {
        userId,
        count: newCount
      });

      logger.debug('SSE event emitted', { userId, count: newCount });
    } catch (error) {
      logger.error('Error emitting SSE count update', {
        userId,
        error: error.message
      });
    }
  }
}

module.exports = new NotificationService();