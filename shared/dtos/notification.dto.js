'use strict';

/**
 * DTO para una notificación individual en lista
 */
class NotificationItemDTO {
  constructor(notification) {
    this.notificationId = notification.notification_id;
    this.type = notification.type;
    this.title = notification.title;
    this.body = notification.body;
    this.metadata = notification.metadata;
    this.isRead = notification.is_read;
    this.readAt = notification.read_at;
    this.createdAt = notification.created_at;

    if (notification.related_entity_type) {
      this.relatedEntity = {
        type: notification.related_entity_type,
        id: notification.related_entity_id
      };
    }

    if (notification.notification_type) {
      this.notificationType = {
        id: notification.notification_type.notification_type_id,
        code: notification.notification_type.code,
        name: notification.notification_type.name
      };
    }
  }
}

/**
 * DTO para lista de notificaciones
 */
class NotificationListDTO {
  constructor(notifications) {
    this.notifications = notifications.map(n => new NotificationItemDTO(n));
  }
}

/**
 * DTO para contador de notificaciones no leídas
 */
class UnreadCountDTO {
  constructor(count) {
    this.unreadCount = count;
  }
}

/**
 * DTO para respuesta de creación de notificación
 */
class NotificationCreatedDTO {
  constructor(result) {
    this.estadoSolicitud = result.estado_solicitud;
    
    if (result.notification_id) {
      this.notificationId = result.notification_id;
    }
    
    if (result.global_notification_id) {
      this.globalNotificationId = result.global_notification_id;
    }
  }
}

module.exports = {
  NotificationItemDTO,
  NotificationListDTO,
  UnreadCountDTO,
  NotificationCreatedDTO
};