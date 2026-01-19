'use strict';

const notificationService = require('../services/notification.service');
const notificationEmitter = require('../utils/notificationEmitter.util');
const ApiResponse = require('../utils/response.util');
const { logger } = require('../utils/logger.util');
const {
  NotificationListDTO,
  UnreadCountDTO,
  NotificationCreatedDTO
} = require('../dtos/notification.dto');

class NotificationController {

  /**
   * Obtiene lista de notificaciones mezcladas (personal + global) con paginación
   * GET /<admin>o<client>/api/notifications?page=1&limit=10&sortBy=created_at&order=DESC
   */
  async getNotificationsList(req, res, next) {
    try {
      const userId = req.user.userId;
      const { data, metadata } = await notificationService.getNotificationsList(userId, req.query);

      const dto = new NotificationListDTO(data);

      return ApiResponse.success(
        res,
        'Notificaciones obtenidas exitosamente',
        dto.notifications,
        200,
        metadata
      );
    } catch (error) {
      logger.error('Error getting notifications list', {
        userId: req.user?.userId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtiene solo notificaciones personales con paginación
   * GET /<admin>o<client>/api/notifications/personal?page=1&limit=10
   */
  async getPersonalNotifications(req, res, next) {
    try {
      const userId = req.user.userId;
      const { data, metadata } = await notificationService.getPersonalNotifications(userId, req.query);

      const dto = new NotificationListDTO(data);

      return ApiResponse.success(
        res,
        'Notificaciones personales obtenidas exitosamente',
        dto.notifications,
        200,
        metadata
      );
    } catch (error) {
      logger.error('Error getting personal notifications', {
        userId: req.user?.userId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtiene solo notificaciones globales con paginación
   * GET /<admin>o<client>/api/notifications/global?page=1&limit=10
   */
  async getGlobalNotifications(req, res, next) {
    try {
      const userId = req.user.userId;
      const { data, metadata } = await notificationService.getGlobalNotifications(userId, req.query);

      const dto = new NotificationListDTO(data);

      return ApiResponse.success(
        res,
        'Notificaciones globales obtenidas exitosamente',
        dto.notifications,
        200,
        metadata
      );
    } catch (error) {
      logger.error('Error getting global notifications', {
        userId: req.user?.userId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Obtiene el contador de notificaciones no leídas
   * GET /<admin>o<client>/api/notifications/count
   */
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.userId;
      const count = await notificationService.getUnreadCount(userId);

      const dto = new UnreadCountDTO(count);

      return ApiResponse.success(res, 'Contador obtenido exitosamente', dto, 200);
    } catch (error) {
      logger.error('Error getting unread count', {
        userId: req.user?.userId,
        error: error.message
      });
      next(error);
    }
  }

  /**
   * Stream SSE para contador de notificaciones en tiempo real
   * GET /<admin>o<client>/api/notifications/count/stream
   */
  async streamUnreadCount(req, res) {
    const userId = req.user.userId;

    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');

      const lastEventId = req.headers['last-event-id'];
      if (lastEventId) {
        logger.debug('SSE reconnection detected', { userId, lastEventId });
      }

      const initialCount = await notificationService.getUnreadCount(userId);
      const eventId = Date.now();

      res.write(`id: ${eventId}\n`);
      res.write(`data: ${JSON.stringify({ count: initialCount })}\n\n`);

      logger.info('SSE connection established', { userId, initialCount });

      const heartbeatInterval = setInterval(() => {
        res.write(`:heartbeat\n\n`);
      }, 30000);

      const eventListener = (data) => {
        if (data.userId === userId) {
          const eventId = Date.now();
          res.write(`id: ${eventId}\n`);
          res.write(`data: ${JSON.stringify({ count: data.count })}\n\n`);

          logger.debug('SSE count update sent', { userId, count: data.count });
        }
      };

      notificationEmitter.on('count-updated', eventListener);

      req.on('close', () => {
        clearInterval(heartbeatInterval);
        notificationEmitter.off('count-updated', eventListener);

        logger.info('SSE connection closed', { userId });
      });

    } catch (error) {
      logger.error('Error in SSE stream', {
        userId,
        error: error.message,
        stack: error.stack
      });

      res.write(`event: error\n`);
      res.write(`data: ${JSON.stringify({ error: 'Error interno del servidor' })}\n\n`);
      res.end();
    }
  }

  /**
   * Crea una notificación (endpoint para servicios externos)
   * POST /<admin>o<client>/api/notifications
   */
  async createNotification(req, res, next) {
    try {
      const metadata = {
        transaction: null
      };

      const result = await notificationService.createNotification(req.body, metadata);

      const dto = new NotificationCreatedDTO(result);

      return ApiResponse.success(res, 'Notificación creada exitosamente', dto, 201);
    } catch (error) {
      logger.error('Error creating notification', {
        body: req.body,
        error: error.message
      });
      next(error);
    }
  }
}

module.exports = new NotificationController();