'use strict';

/**
 * Paths de NotificationType para Swagger
 */

const notificationTypePaths = {
  '/admin/api/notification-types': {
    get: {
      tags: ['Notification Types - Admin'],
      summary: 'Lista tipos de notificación con paginación',
      description: 'Obtiene una lista paginada de tipos de notificación con filtros opcionales',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Número de página'
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Cantidad de elementos por página'
        },
        {
          name: 'sortBy',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            example: 'name'
          },
          description: 'Campo por el cual ordenar'
        },
        {
          name: 'order',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'ASC'
          },
          description: 'Dirección del ordenamiento'
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          description: 'Término de búsqueda (busca en name, code, description)'
        },
        {
          name: 'isActive',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          },
          description: 'Filtrar por estado activo/inactivo'
        },
        {
          name: 'supportsPush',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          },
          description: 'Filtrar por soporte de notificaciones push'
        },
        {
          name: 'supportsEmail',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean'
          },
          description: 'Filtrar por soporte de notificaciones email'
        },
        {
          name: 'priority',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['normal', 'high']
          },
          description: 'Filtrar por prioridad'
        }
      ],
      responses: {
        200: {
          description: 'Tipos de notificación obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotificationTypeListResponse'
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/notification-types/{notificationTypeId}': {
    patch: {
      tags: ['Notification Types - Admin'],
      summary: 'Actualiza un tipo de notificación',
      description: 'Actualiza los campos permitidos de un tipo de notificación existente',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'notificationTypeId',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID del tipo de notificación'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateNotificationTypeRequest'
            },
            examples: {
              updateBasicInfo: {
                summary: 'Actualizar información básica',
                value: {
                  name: 'Email de Bienvenida Actualizado',
                  description: 'Email enviado al usuario cuando se registra exitosamente',
                  priority: 'high'
                }
              },
              updateTemplates: {
                summary: 'Actualizar templates',
                value: {
                  title_template: 'Hola {{nombre}}, bienvenido!',
                  body_template: 'Estamos felices de tenerte con nosotros',
                  supports_push: true
                }
              },
              updateEmailSupport: {
                summary: 'Activar soporte de email',
                value: {
                  supports_email: true,
                  email_subject_template: 'Bienvenido a nuestra plataforma',
                  email_body_template: '<html><body><h1>Bienvenido {{nombre}}</h1><p>Gracias por registrarte</p></body></html>'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Tipo de notificación actualizado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotificationTypeResponse'
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/notification-types/global': {
    post: {
      tags: ['Notification Types - Admin'],
      summary: 'Crea una notificación global usando NOTIFICACION_GENERAL',
      description: 'Crea una notificación que será enviada a todos los usuarios activos de la plataforma usando el tipo NOTIFICACION_GENERAL',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateGlobalNotificationRequest'
            },
            examples: {
              mantenimiento: {
                summary: 'Notificación de mantenimiento',
                value: {
                  titulo: 'Mantenimiento programado',
                  contenido: 'El sistema estará en mantenimiento el día 20 de enero de 2024 desde las 00:00 hasta las 06:00 horas.',
                  asunto: 'Mantenimiento Programado - Sistema'
                }
              },
              nuevaFuncionalidad: {
                summary: 'Nueva funcionalidad',
                value: {
                  titulo: 'Nueva funcionalidad disponible',
                  contenido: 'Ahora puedes exportar tus reportes en formato PDF. Accede a la sección de reportes para probarlo.',
                  asunto: 'Nueva funcionalidad: Exportar a PDF'
                }
              },
              actualizacionTerminos: {
                summary: 'Actualización de términos',
                value: {
                  titulo: 'Actualización de términos y condiciones',
                  contenido: 'Hemos actualizado nuestros términos y condiciones. Por favor revísalos en tu próximo inicio de sesión.',
                  asunto: 'Actualización de términos y condiciones'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Notificación global creada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GlobalNotificationResponse'
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  }
};

module.exports = notificationTypePaths;