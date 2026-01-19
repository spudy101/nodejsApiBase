'use strict';

/**
 * Schemas de Notificaciones para Swagger
 */

const notificationSchemas = {
  // ==================== NOTIFICATION TYPE ====================

  NotificationType: {
    type: 'object',
    required: ['id', 'code', 'name'],
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del tipo de notificación'
      },
      code: {
        type: 'string',
        example: 'KYC_APPROVED',
        description: 'Código del tipo de notificación'
      },
      name: {
        type: 'string',
        example: 'KYC Aprobado',
        description: 'Nombre del tipo de notificación'
      }
    }
  },

  // ==================== NOTIFICATION ITEM ====================

  NotificationItem: {
    type: 'object',
    required: ['notificationId', 'type', 'title', 'body', 'isRead', 'createdAt'],
    properties: {
      notificationId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la notificación'
      },
      type: {
        type: 'string',
        enum: ['personal', 'global'],
        example: 'personal',
        description: 'Tipo de notificación (personal o global)'
      },
      title: {
        type: 'string',
        example: 'Verificación completada',
        description: 'Título de la notificación'
      },
      body: {
        type: 'string',
        example: 'Tu verificación KYC ha sido aprobada exitosamente',
        description: 'Cuerpo/mensaje de la notificación'
      },
      metadata: {
        type: 'object',
        nullable: true,
        additionalProperties: true,
        example: { additionalInfo: 'datos extra' },
        description: 'Metadata adicional de la notificación'
      },
      isRead: {
        type: 'boolean',
        example: false,
        description: 'Indica si la notificación fue leída'
      },
      readAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha en que se leyó la notificación'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación de la notificación'
      },
      relatedEntity: {
        type: 'object',
        nullable: true,
        properties: {
          type: {
            type: 'string',
            example: 'kyc_request',
            description: 'Tipo de entidad relacionada'
          },
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
            description: 'ID de la entidad relacionada'
          }
        },
        description: 'Entidad relacionada (solo para notificaciones personales)'
      },
      notificationType: {
        allOf: [
          { $ref: '#/components/schemas/NotificationType' }
        ],
        nullable: true,
        description: 'Tipo de notificación'
      }
    }
  },

  // ==================== UNREAD COUNT ====================

  UnreadCount: {
    type: 'object',
    required: ['unreadCount'],
    properties: {
      unreadCount: {
        type: 'integer',
        example: 5,
        minimum: 0,
        description: 'Cantidad de notificaciones no leídas'
      }
    }
  },

  // ==================== CREATE NOTIFICATION ====================

  CreateNotificationRequest: {
    type: 'object',
    required: ['tipo_notificacion'],
    properties: {
      tipo_notificacion: {
        type: 'string',
        example: 'KYC_APPROVED',
        description: 'Código del tipo de notificación'
      },
      user_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del usuario (para notificaciones personales)',
        nullable: true
      },
      metadata: {
        type: 'object',
        additionalProperties: true,
        example: { requestId: '123', status: 'approved' },
        description: 'Metadata adicional',
        nullable: true
      },
      related_entity: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            example: 'kyc_request',
            description: 'Tipo de entidad relacionada'
          },
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
            description: 'ID de la entidad relacionada'
          }
        },
        description: 'Entidad relacionada',
        nullable: true
      }
    }
  },

  CreateNotificationResponse: {
    type: 'object',
    required: ['estadoSolicitud'],
    properties: {
      estadoSolicitud: {
        type: 'string',
        enum: ['exitoso', 'error'],
        example: 'exitoso',
        description: 'Estado de la solicitud'
      },
      notificationId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la notificación personal creada',
        nullable: true
      },
      globalNotificationId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la notificación global creada',
        nullable: true
      }
    }
  },

  // ==================== SSE EVENT ====================

  SSECountEvent: {
    type: 'object',
    required: ['count'],
    properties: {
      count: {
        type: 'integer',
        example: 3,
        minimum: 0,
        description: 'Contador actualizado de notificaciones no leídas'
      }
    },
    description: 'Evento SSE con contador actualizado'
  }
};

module.exports = notificationSchemas;