'use strict';

/**
 * Schemas de NotificationType para Swagger
 */

const notificationTypeSchemas = {
  // ==================== NOTIFICATION TYPE ====================

  NotificationType: {
    type: 'object',
    properties: {
      notification_type_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único del tipo de notificación'
      },
      code: {
        type: 'string',
        example: 'BIENVENIDA',
        description: 'Código único del tipo de notificación'
      },
      name: {
        type: 'string',
        example: 'Email de Bienvenida',
        description: 'Nombre del tipo de notificación'
      },
      description: {
        type: 'string',
        nullable: true,
        example: 'Email enviado al usuario cuando se registra',
        description: 'Descripción del tipo de notificación'
      },
      supports_push: {
        type: 'boolean',
        example: true,
        description: 'Indica si soporta notificaciones push'
      },
      supports_email: {
        type: 'boolean',
        example: true,
        description: 'Indica si soporta notificaciones por email'
      },
      priority: {
        type: 'string',
        enum: ['normal', 'high'],
        example: 'normal',
        description: 'Prioridad de la notificación'
      },
      title_template: {
        type: 'string',
        nullable: true,
        example: 'Bienvenido {{nombre}}',
        description: 'Template del título de la notificación push'
      },
      body_template: {
        type: 'string',
        nullable: true,
        example: 'Gracias por registrarte en nuestra plataforma',
        description: 'Template del cuerpo de la notificación push'
      },
      email_subject_template: {
        type: 'string',
        nullable: true,
        example: 'Bienvenido a la plataforma',
        description: 'Template del asunto del email'
      },
      email_body_template: {
        type: 'string',
        nullable: true,
        example: '<html><body><h1>Bienvenido {{nombre}}</h1></body></html>',
        description: 'Template del cuerpo del email (HTML)'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el tipo de notificación está activo'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  // ==================== REQUEST BODIES ====================

  UpdateNotificationTypeRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        example: 'Email de Bienvenida',
        description: 'Nombre del tipo de notificación'
      },
      description: {
        type: 'string',
        maxLength: 500,
        example: 'Email enviado al usuario cuando se registra',
        description: 'Descripción del tipo de notificación'
      },
      supports_push: {
        type: 'boolean',
        example: true,
        description: 'Indica si soporta notificaciones push'
      },
      supports_email: {
        type: 'boolean',
        example: true,
        description: 'Indica si soporta notificaciones por email'
      },
      priority: {
        type: 'string',
        enum: ['normal', 'high'],
        example: 'normal',
        description: 'Prioridad de la notificación'
      },
      title_template: {
        type: 'string',
        maxLength: 255,
        example: 'Bienvenido {{nombre}}',
        description: 'Template del título de la notificación push'
      },
      body_template: {
        type: 'string',
        example: 'Gracias por registrarte en nuestra plataforma',
        description: 'Template del cuerpo de la notificación push'
      },
      email_subject_template: {
        type: 'string',
        minLength: 3,
        maxLength: 255,
        example: 'Bienvenido a la plataforma',
        description: 'Template del asunto del email (requerido si supports_email es true)'
      },
      email_body_template: {
        type: 'string',
        example: '<html><body><h1>Bienvenido {{nombre}}</h1></body></html>',
        description: 'Template del cuerpo del email en HTML (requerido si supports_email es true)'
      }
    }
  },

  CreateGlobalNotificationRequest: {
    type: 'object',
    required: ['titulo', 'contenido', 'asunto'],
    properties: {
      titulo: {
        type: 'string',
        minLength: 3,
        maxLength: 255,
        example: 'Mantenimiento programado',
        description: 'Título de la notificación global (reemplaza {{titulo}} en el template)'
      },
      contenido: {
        type: 'string',
        minLength: 3,
        example: 'El sistema estará en mantenimiento el día 20 de enero de 2024',
        description: 'Contenido de la notificación global (reemplaza {{contenido}} en el template)'
      },
      asunto: {
        type: 'string',
        minLength: 3,
        maxLength: 255,
        example: 'Mantenimiento Programado - Sistema',
        description: 'Asunto del email (reemplaza {{asunto}} en el template)'
      }
    }
  },

  // ==================== RESPONSES ====================

  NotificationTypeResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      statusCode: {
        type: 'integer',
        example: 200
      },
      message: {
        type: 'string',
        example: 'Tipo de notificación actualizado exitosamente'
      },
      data: {
        $ref: '#/components/schemas/NotificationType'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  NotificationTypeListResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      statusCode: {
        type: 'integer',
        example: 200
      },
      message: {
        type: 'string',
        example: 'Tipos de notificación obtenidos exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/NotificationType'
        }
      },
      metadata: {
        type: 'object',
        properties: {
          pagination: {
            $ref: '#/components/schemas/PaginationMetadata'
          },
          filters: {
            type: 'object',
            nullable: true,
            example: {
              isActive: true,
              priority: 'high'
            }
          },
          sort: {
            type: 'object',
            properties: {
              field: {
                type: 'string',
                example: 'name'
              },
              order: {
                type: 'string',
                enum: ['ASC', 'DESC'],
                example: 'ASC'
              }
            }
          }
        }
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  GlobalNotification: {
    type: 'object',
    properties: {
      global_notification_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único de la notificación global'
      },
      titulo: {
        type: 'string',
        example: 'Mantenimiento programado',
        description: 'Título de la notificación'
      },
      contenido: {
        type: 'string',
        example: 'El sistema estará en mantenimiento el día 20 de enero de 2024',
        description: 'Contenido de la notificación'
      },
      asunto: {
        type: 'string',
        example: 'Mantenimiento Programado - Sistema',
        description: 'Asunto del email'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      }
    }
  },

  GlobalNotificationResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      statusCode: {
        type: 'integer',
        example: 201
      },
      message: {
        type: 'string',
        example: 'Notificación global creada exitosamente'
      },
      data: {
        $ref: '#/components/schemas/GlobalNotification'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  }
};

module.exports = notificationTypeSchemas;