'use strict';

const notificationTypeService = require('../services/notificationType.service');
const ApiResponse = require('../../../shared/utils/response.util');
const { logger } = require('../../../shared/utils/logger.util');
const { CreateGlobalNotificationDto } = require('../dtos/notificationType.dto');

class NotificationTypeController {
  /**
   * Actualiza un tipo de notificación
   * PATCH /admin/api/notification-types/:notificationTypeId
   */
  async update(req, res, next) {
    try {
      const { notificationTypeId } = req.params;
      const data = await notificationTypeService.update(notificationTypeId, req.body);
      return ApiResponse.success(res, 'Tipo de notificación actualizado exitosamente', data);
    } catch (error) {
      logger.error('Error updating notification type', { error: error.message });
      next(error);
    }
  }

  /**
   * Lista tipos de notificación con paginación
   * GET /admin/api/notification-types?page=1&limit=10&sortBy=name&order=ASC&search=push&isActive=true&supportsPush=true&supportsEmail=true&priority=high
   */
  async list(req, res, next) {
    try {
      const { data, metadata } = await notificationTypeService.list(req.query);
      return ApiResponse.success(res, 'Tipos de notificación obtenidos exitosamente', data, 200, metadata);
    } catch (error) {
      logger.error('Error listing notification types', { error: error.message });
      next(error);
    }
  }

  /**
   * Crea una notificación global dinámica
   * POST /admin/api/notification-types/global
   */
  async createGlobalNotification(req, res, next) {
    try {
      const dto = new CreateGlobalNotificationDto(req.body);
      const data = await notificationTypeService.createGlobalNotification(dto);
      return ApiResponse.success(res, 'Notificación global creada exitosamente', data, 201);
    } catch (error) {
      logger.error('Error creating global notification', { error: error.message });
      next(error);
    }
  }
}

module.exports = new NotificationTypeController();