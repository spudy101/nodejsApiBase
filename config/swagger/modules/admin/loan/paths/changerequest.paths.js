/**
 * Change Request Swagger Paths - REFACTORIZADO
 * 
 * IMPORTANTE: Las rutas de aprobación/rechazo fueron movidas a cada servicio específico:
 * - ProductLoan: /admin/api/loan/products/change-requests/:id/approve|reject
 * - SystemGlobalConfig: /admin/api/loan/system-config/change-requests/:id/approve|reject
 * 
 * Este servicio ahora solo maneja:
 * - Consultas (listar, ver detalle)
 * - Filtros por entity_type, status, change_type
 * - Cancelación (solo el solicitante)
 * - Estadísticas
 */

const changeRequestPaths = {
  '/admin/api/loan/change-requests': {
    get: {
      tags: ['Change Requests - Admin'],
      summary: 'Lista todas las solicitudes de cambio',
      description: 'Obtiene lista paginada de solicitudes con filtros por status, entityType y changeType',
      security: [{BearerAuth: []}],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          schema: {type: 'integer', minimum: 1, default: 1}
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Elementos por página',
          schema: {type: 'integer', minimum: 1, maximum: 100, default: 10}
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filtrar por estado de la solicitud',
          schema: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'cancelled']
          }
        },
        {
          name: 'entityType',
          in: 'query',
          description: 'Filtrar por tipo de entidad',
          schema: {
            type: 'string',
            enum: ['product_loan', 'system_global_config', 'loan_application_review', 'loan']
          }
        },
        {
          name: 'changeType',
          in: 'query',
          description: 'Filtrar por tipo de cambio',
          schema: {
            type: 'string',
            enum: [
              'update_product',
              'update_client_config',
              'activate_product',
              'deactivate_product',
              'update_global_config',
              'activate_config_version',
              'approve_with_modifications',
              'update_loan_rates'
            ]
          }
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Campo por el cual ordenar',
          schema: {
            type: 'string',
            enum: ['created_at', 'updated_at', 'reviewed_at', 'applied_at', 'status'],
            default: 'created_at'
          }
        },
        {
          name: 'order',
          in: 'query',
          description: 'Dirección del ordenamiento',
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC'
          }
        }
      ],
      responses: {
        200: {
          description: 'Solicitudes obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {$ref: '#/components/schemas/ChangeRequestListResponse'}
            }
          }
        },
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },

  '/admin/api/loan/change-requests/stats': {
    get: {
      tags: ['Change Requests - Admin'],
      summary: 'Obtiene estadísticas de solicitudes',
      description: 'Obtiene estadísticas globales de todas las solicitudes de cambio',
      security: [{BearerAuth: []}],
      responses: {
        200: {
          description: 'Estadísticas obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {$ref: '#/components/schemas/ChangeRequestStatsResponse'}
            }
          }
        },
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },

  '/admin/api/loan/change-requests/pending': {
    get: {
      tags: ['Change Requests - Admin'],
      summary: 'Lista solicitudes pendientes',
      description: 'Obtiene lista de solicitudes pendientes con filtro opcional por tipo de entidad',
      security: [{BearerAuth: []}],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          schema: {type: 'integer', minimum: 1, default: 1}
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Elementos por página',
          schema: {type: 'integer', minimum: 1, maximum: 100, default: 10}
        },
        {
          name: 'entityType',
          in: 'query',
          description: 'Filtrar por tipo de entidad (opcional)',
          schema: {
            type: 'string',
            enum: ['product_loan', 'system_global_config', 'loan_application_review', 'loan']
          }
        }
      ],
      responses: {
        200: {
          description: 'Solicitudes pendientes obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {$ref: '#/components/schemas/ChangeRequestListResponse'}
            }
          }
        },
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },

  '/admin/api/loan/change-requests/{id}': {
    get: {
      tags: ['Change Requests - Admin'],
      summary: 'Obtiene detalle de una solicitud',
      description: 'Obtiene información completa de una solicitud de cambio específica',
      security: [{BearerAuth: []}],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'ID de la solicitud de cambio',
          required: true,
          schema: {$ref: '#/components/schemas/UUID'}
        }
      ],
      responses: {
        200: {
          description: 'Detalle obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {$ref: '#/components/schemas/SuccessResponse'},
                  {
                    type: 'object',
                    properties: {
                      data: {$ref: '#/components/schemas/ChangeRequest'}
                    }
                  }
                ]
              }
            }
          }
        },
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        404: {$ref: '#/components/responses/NotFound'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },

  '/admin/api/loan/change-requests/{id}/cancel': {
    post: {
      tags: ['Change Requests - Admin'],
      summary: 'Cancela una solicitud (solo solicitante)',
      description: 'Permite al solicitante cancelar su propia solicitud mientras esté en estado pendiente',
      security: [{BearerAuth: []}],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'ID de la solicitud de cambio',
          required: true,
          schema: {$ref: '#/components/schemas/UUID'}
        }
      ],
      responses: {
        200: {
          description: 'Solicitud cancelada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {$ref: '#/components/schemas/SuccessResponse'},
                  {
                    type: 'object',
                    properties: {
                      data: {$ref: '#/components/schemas/ChangeRequest'}
                    }
                  }
                ]
              }
            }
          }
        },
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {
          description: 'Forbidden - Solo el solicitante puede cancelar su propia solicitud',
          content: {
            'application/json': {
              schema: {$ref: '#/components/schemas/ErrorResponse'}
            }
          }
        },
        404: {$ref: '#/components/responses/NotFound'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  }
};

module.exports = changeRequestPaths;