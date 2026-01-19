'use strict';

const notificationTypeRepository = require('../../../shared/repositories/notificationType.repository');
const NotificationUtil = require('../../../shared/utils/notification.util');
const AppError = require('../../../shared/utils/appError.util');
const PaginationHelper = require('../../../shared/utils/paginationHelper.util');
const { logger } = require('../../../shared/utils/logger.util');
const { sequelize } = require('../../../shared/models');
const {
  UpdateNotificationTypeResponseDto,
  ListNotificationTypesResponseDto,
  CreateGlobalNotificationResponseDto,
} = require('../dtos/notificationType.dto');

class NotificationTypeService {

  /**
   * Actualiza un tipo de notificación
   */
  async update(notificationTypeId, data) {
    const transaction = await sequelize.transaction();

    try {
      const notificationType = await this._validateNotificationTypeExists(notificationTypeId);

      const updatedNotificationType = await this._updateAllowedFields(
        notificationType, 
        data, 
        { transaction }
      );

      await transaction.commit();

      logger.info('Notification type updated successfully', {
        notificationTypeId,
        code: updatedNotificationType.code,
      });

      return new UpdateNotificationTypeResponseDto(updatedNotificationType);

    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating notification type', {
        notificationTypeId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Lista tipos de notificación con paginación
   * Query params: page, limit, sortBy, order, search, isActive, supportsPush, supportsEmail, priority
   */
  async list(query) {
    const paginationParams = PaginationHelper.getPaginationParams(query);
    const filters = PaginationHelper.buildFilters(query, [
      'isActive',
      'supportsPush',
      'supportsEmail',
      'priority'
    ]);
    const searchTerm = query.search || null;

    const { rows, count } = await notificationTypeRepository.findAllPaginated(
      filters,
      paginationParams,
      searchTerm
    );

    const metadata = PaginationHelper.buildMetadata(
      count,
      paginationParams.page,
      paginationParams.limit,
      searchTerm ? { search: searchTerm, ...filters } : filters,
      { field: paginationParams.sortBy, order: paginationParams.order }
    );

    logger.info('Notification types listed successfully', {
      totalItems: count,
      page: paginationParams.page
    });

    return new ListNotificationTypesResponseDto(rows, {
      pagination: metadata.pagination,
      filters: metadata.filters,
      sort: metadata.sort,
    });
  }

  /**
   * Crea una notificación global dinámica
   */
  async createGlobalNotification(data) {
    const transaction = await sequelize.transaction();

    try {
      const {
        title,
        body,
        supports_push,
        supports_email,
        priority,
        email_subject,
        email_body
      } = data;

      const result = await NotificationUtil.crearNotificacion(
        {
          user_id: null,
          dynamic_config: {
            title,
            body,
            supports_push,
            supports_email,
            priority,
            email_subject,
            email_body
          },
          metadata: {}
        },
        transaction
      );

      await transaction.commit();

      logger.info('Global dynamic notification created successfully', {
        global_notification_id: result.global_notification_id,
        supports_push,
        supports_email,
        priority
      });

      return new CreateGlobalNotificationResponseDto({
        global_notification_id: result.global_notification_id,
        title,
        body,
        supports_push,
        supports_email,
        priority,
      });

    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating global notification', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Valida que el tipo de notificación exista
   * @private
   */
  async _validateNotificationTypeExists(notificationTypeId) {
    const notificationType = await notificationTypeRepository.findById(notificationTypeId);

    if (!notificationType) {
      throw AppError.notFound('Tipo de notificación no encontrado');
    }

    return notificationType;
  }

  /**
   * Actualiza solo los campos permitidos que vengan en data
   * @private
   */
  async _updateAllowedFields(notificationType, data, options = {}) {
    const allowedFields = [
      'name',
      'description',
      'supports_push',
      'supports_email',
      'priority',
      'title_template',
      'body_template',
      'email_subject_template',
      'email_body_template',
    ];

    const updateData = {};
    
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return notificationType;
    }

    return await notificationType.update(updateData, options);
  }
}

module.exports = new NotificationTypeService();