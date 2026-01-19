'use strict';

/**
 * DTO base para paginación
 */
class PaginationDto {
  constructor(data) {
    this.currentPage = data.currentPage;
    this.pageSize = data.pageSize;
    this.totalItems = data.totalItems;
    this.totalPages = data.totalPages;
    this.hasNextPage = data.hasNextPage;
    this.hasPreviousPage = data.hasPreviousPage;
  }
}

/**
 * DTO base para ordenamiento
 */
class SortDto {
  constructor(data) {
    this.field = data.field;
    this.order = data.order;
  }
}

/**
 * DTO base para metadata
 */
class MetadataDto {
  constructor(data) {
    this.pagination = new PaginationDto(data.pagination);
    this.sort = new SortDto(data.sort);
    if (data.filters && Object.keys(data.filters).length > 0) {
      this.filters = data.filters;
    }
  }
}

/**
 * DTO para NotificationType individual
 */
class NotificationTypeDto {
  constructor(data) {
    this.notification_type_id = data.notification_type_id;
    this.code = data.code;
    this.name = data.name;
    this.description = data.description;
    this.supports_push = data.supports_push;
    this.supports_email = data.supports_email;
    this.priority = data.priority;
    this.title_template = data.title_template;
    this.body_template = data.body_template;
    this.email_subject_template = data.email_subject_template;
    this.email_body_template = data.email_body_template;
    this.is_active = data.is_active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * DTO para respuesta de lista de tipos de notificación
 */
class ListNotificationTypesResponseDto {
  constructor(data, metadata) {
    this.data = Array.isArray(data) ? data.map(type => new NotificationTypeDto(type)) : [];
    this.metadata = new MetadataDto(metadata);
  }
}

/**
 * DTO para respuesta de actualización de tipo de notificación
 */
class UpdateNotificationTypeResponseDto {
  constructor(data) {
    this.data = new NotificationTypeDto(data);
  }
}

/**
 * DTO para crear notificación global dinámica
 */
class CreateGlobalNotificationDto {
  constructor(data) {
    this.title = data.title;
    this.body = data.body;
    this.supports_push = data.supports_push !== undefined ? data.supports_push : false;
    this.supports_email = data.supports_email !== undefined ? data.supports_email : false;
    this.priority = data.priority || 'normal';
    this.email_subject = data.email_subject || null;
    this.email_body = data.email_body || null;
  }
}

/**
 * DTO para respuesta de creación de notificación global
 */
class CreateGlobalNotificationResponseDto {
  constructor(data) {
    this.global_notification_id = data.global_notification_id;
    this.title = data.title;
    this.body = data.body;
    this.supports_push = data.supports_push;
    this.supports_email = data.supports_email;
    this.priority = data.priority;
    this.total_target_users = data.total_target_users || 0;
    this.processing_status = 'queued';
    this.created_at = data.created_at || new Date();
  }
}

module.exports = {
  NotificationTypeDto,
  ListNotificationTypesResponseDto,
  UpdateNotificationTypeResponseDto,
  CreateGlobalNotificationDto,
  CreateGlobalNotificationResponseDto,
  PaginationDto,
  SortDto,
  MetadataDto,
};