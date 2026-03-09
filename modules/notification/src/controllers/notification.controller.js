'use strict';

const NotificationService  = require('../services/notification.service');
const NotificationEmitter  = require('../utils/notification-emitter.util');
const ApiResponse          = require('../../../../shared/utils/app-response.util');
const { asyncHandler }     = require('../../../../shared/middlewares/error.middleware');
const { logger }           = require('../../../../shared/utils/logger.util');
const {
  NotificationListDTO,
  UnreadCountDTO,
  NotificationCreatedDTO,
} = require('../dtos/notification.dto');

class NotificationController {

  /**
   * GET /notifications
   * Lista mezclada (personal + global) con paginación
   */
  getNotificationsList = asyncHandler(async (req, res) => {
    const { data, metadata } = await NotificationService.getNotificationsList(
      req.user.userId,
      req.query
    );

    const dto = new NotificationListDTO(data);
    return ApiResponse.success(res, 'Notificaciones obtenidas exitosamente', dto.notifications, 200, metadata);
  });

  /**
   * GET /notifications/personal
   */
  getPersonalNotifications = asyncHandler(async (req, res) => {
    const { data, metadata } = await NotificationService.getPersonalNotifications(
      req.user.userId,
      req.query
    );

    const dto = new NotificationListDTO(data);
    return ApiResponse.success(res, 'Notificaciones personales obtenidas exitosamente', dto.notifications, 200, metadata);
  });

  /**
   * GET /notifications/global
   */
  getGlobalNotifications = asyncHandler(async (req, res) => {
    const { data, metadata } = await NotificationService.getGlobalNotifications(
      req.user.userId,
      req.query
    );

    const dto = new NotificationListDTO(data);
    return ApiResponse.success(res, 'Notificaciones globales obtenidas exitosamente', dto.notifications, 200, metadata);
  });

  /**
   * GET /notifications/count
   */
  getUnreadCount = asyncHandler(async (req, res) => {
    const count = await NotificationService.getUnreadCount(req.user.userId);
    return ApiResponse.success(res, 'Count obtenido exitosamente', new UnreadCountDTO(count));
  });

  /**
   * GET /notifications/count/stream
   * SSE — stream en tiempo real del contador de no leídas
   */
  streamUnreadCount = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    res.setHeader('Content-Type',                  'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control',                 'no-cache, no-transform');
    res.setHeader('Connection',                    'keep-alive');
    res.setHeader('X-Accel-Buffering',             'no');
    res.setHeader('Access-Control-Allow-Origin',   '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // Abrir stream
    res.write(':ok\n\n');

    // Count inicial
    const initialCount = await NotificationService.getUnreadCount(userId);
    res.write(`id: ${Date.now()}\n`);
    res.write(`data: ${JSON.stringify({ count: initialCount })}\n\n`);
    res.flushHeaders();

    logger.info('SSE connection established', { userId, initialCount });

    // Heartbeat cada 30 segundos
    const heartbeatInterval = setInterval(() => {
      res.write(`:heartbeat ${Date.now()}\n\n`);
    }, 30000);

    // Listener de actualizaciones
    const eventListener = (data) => {
      if (data.userId === userId) {
        res.write(`id: ${Date.now()}\n`);
        res.write(`data: ${JSON.stringify({ count: data.count })}\n\n`);
        logger.debug('SSE count update sent', { userId, count: data.count });
      }
    };

    NotificationEmitter.on('count-updated', eventListener);

    // Cleanup al cerrar conexión
    req.on('close', () => {
      clearInterval(heartbeatInterval);
      NotificationEmitter.off('count-updated', eventListener);
      logger.info('SSE connection closed', { userId });
    });
  });

  /**
   * POST /notifications
   * Crear notificación (endpoint para servicios externos)
   */
  createNotification = asyncHandler(async (req, res) => {
    const result = await NotificationService.createNotification(req.body, { transaction: null });
    return ApiResponse.success(res, 'Notificación creada exitosamente', new NotificationCreatedDTO(result), 201);
  });
}

module.exports = new NotificationController();