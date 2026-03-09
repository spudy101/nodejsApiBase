'use strict';

/**
 * Paths de Notificaciones para Swagger
 */

const notificationPaths = {
  // ==================== GET MIXED LIST ====================

  '/<admin>o<client>/api/notifications': {
    get: {
      tags: ['Notifications - Shared'],
      summary: 'Obtener lista mezclada de notificaciones',
      description: 'Obtiene notificaciones personales y globales mezcladas con paginación. Las notificaciones se marcan como leídas automáticamente al obtenerlas.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Número de página'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Cantidad de elementos por página'
        },
        {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string',
            default: 'created_at'
          },
          description: 'Campo por el cual ordenar'
        },
        {
          in: 'query',
          name: 'order',
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC'
          },
          description: 'Dirección del ordenamiento'
        },
        {
          in: 'query',
          name: 'search',
          schema: {
            type: 'string'
          },
          description: 'Término de búsqueda'
        }
      ],
      responses: {
        200: {
          description: 'Notificaciones obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'metadata', 'timestamp'],
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
                    example: 'Notificaciones obtenidas exitosamente'
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/NotificationItem'
                    }
                  },
                  metadata: {
                    $ref: '#/components/schemas/CompleteMetadata'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  // ==================== GET PERSONAL LIST ====================

  '/<admin>o<client>/api/notifications/personal': {
    get: {
      tags: ['Notifications - Shared'],
      summary: 'Obtener solo notificaciones personales',
      description: 'Obtiene únicamente las notificaciones personales del usuario con paginación. Las notificaciones se marcan como leídas automáticamente.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Número de página'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Cantidad de elementos por página'
        },
        {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string',
            default: 'created_at'
          },
          description: 'Campo por el cual ordenar'
        },
        {
          in: 'query',
          name: 'order',
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC'
          },
          description: 'Dirección del ordenamiento'
        },
        {
          in: 'query',
          name: 'search',
          schema: {
            type: 'string'
          },
          description: 'Término de búsqueda'
        }
      ],
      responses: {
        200: {
          description: 'Notificaciones personales obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'metadata', 'timestamp'],
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
                    example: 'Notificaciones personales obtenidas exitosamente'
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/NotificationItem'
                    }
                  },
                  metadata: {
                    $ref: '#/components/schemas/CompleteMetadata'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  // ==================== GET GLOBAL LIST ====================

  '/<admin>o<client>/api/notifications/global': {
    get: {
      tags: ['Notifications - Shared'],
      summary: 'Obtener solo notificaciones globales',
      description: 'Obtiene únicamente las notificaciones globales activas con paginación. Las notificaciones se marcan como leídas automáticamente.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Número de página'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Cantidad de elementos por página'
        },
        {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string',
            default: 'created_at'
          },
          description: 'Campo por el cual ordenar'
        },
        {
          in: 'query',
          name: 'order',
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC'
          },
          description: 'Dirección del ordenamiento'
        }
      ],
      responses: {
        200: {
          description: 'Notificaciones globales obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'metadata', 'timestamp'],
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
                    example: 'Notificaciones globales obtenidas exitosamente'
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/NotificationItem'
                    }
                  },
                  metadata: {
                    $ref: '#/components/schemas/CompleteMetadata'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  // ==================== GET UNREAD COUNT ====================

  '/<admin>o<client>/api/notifications/count': {
    get: {
      tags: ['Notifications - Shared'],
      summary: 'Obtener contador de notificaciones no leídas',
      description: 'Obtiene el total de notificaciones no leídas (personales + globales) del usuario.',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Contador obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
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
                    example: 'Contador obtenido exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/UnreadCount'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time'
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  // ==================== SSE STREAM ====================

  '/<admin>o<client>/api/notifications/count/stream': {
    get: {
      tags: ['Notifications - Shared'],
      summary: 'Stream SSE para contador en tiempo real',
      description: 'Establece una conexión SSE (Server-Sent Events) para recibir actualizaciones en tiempo real del contador de notificaciones no leídas. El servidor envía heartbeats cada 30 segundos para mantener la conexión activa.',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Conexión SSE establecida exitosamente',
          content: {
            'text/event-stream': {
              schema: {
                type: 'string',
                example: 'id: 1705491000000\ndata: {"count":5}\n\n',
                description: 'Stream de eventos SSE en formato text/event-stream'
              },
              examples: {
                initialEvent: {
                  summary: 'Evento inicial al conectarse',
                  value: 'id: 1705491000000\ndata: {"count":5}\n\n'
                },
                updateEvent: {
                  summary: 'Evento de actualización',
                  value: 'id: 1705491030000\ndata: {"count":3}\n\n'
                },
                heartbeat: {
                  summary: 'Heartbeat (cada 30s)',
                  value: ':heartbeat\n\n'
                },
                errorEvent: {
                  summary: 'Evento de error',
                  value: 'event: error\ndata: {"error":"Error interno del servidor"}\n\n'
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  }
};

module.exports = notificationPaths;