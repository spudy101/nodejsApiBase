/**
 * System Global Config Swagger Paths - REFACTORIZADO
 * 
 * INCLUYE: Rutas de aprobación/rechazo de cambios (movidas desde ChangeRequestService)
 */

const systemGlobalConfigPaths = {
  '/admin/api/loan/system-config': {
    get: {
      tags: ['System Global Config - Admin'],
      summary: 'Obtiene configuración global activa',
      description: 'Obtiene la versión activa de la configuración global del sistema',
      security: [{BearerAuth: []}],
      responses: {
        200: {
          description: 'Configuración obtenida exitosamente',
          content: {'application/json': {schema: {$ref: '#/components/schemas/SystemGlobalConfigResponse'}}}
        },
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        404: {$ref: '#/components/responses/NotFound'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },

  '/admin/api/loan/system-config/stats': {
    get: {
      tags: ['System Global Config - Admin'],
      summary: 'Obtiene estadísticas de configuración',
      description: 'Obtiene estadísticas sobre versiones de configuración',
      security: [{BearerAuth: []}],
      responses: {
        200: {
          description: 'Estadísticas obtenidas exitosamente',
          content: {'application/json': {schema: {$ref: '#/components/schemas/SystemGlobalConfigStatsResponse'}}}
        },
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },

  '/admin/api/loan/system-config/history': {
    get: {
      tags: ['System Global Config - Admin'],
      summary: 'Obtiene historial de configuraciones',
      description: 'Obtiene lista paginada de todas las versiones de configuración',
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
        }
      ],
      responses: {
        200: {
          description: 'Historial obtenido exitosamente',
          content: {'application/json': {schema: {$ref: '#/components/schemas/SystemGlobalConfigHistoryResponse'}}}
        },
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },

  '/admin/api/loan/system-config/request-change': {
    post: {
      tags: ['System Global Config - Admin'],
      summary: 'Solicita cambio en configuración global',
      description: 'Crea una solicitud de cambio que requiere aprobación de otro administrador',
      security: [{BearerAuth: []}],
      requestBody: {
        required: true,
        content: {'application/json': {schema: {$ref: '#/components/schemas/RequestGlobalConfigChangeRequest'}}}
      },
      responses: {
        201: {
          description: 'Solicitud de cambio creada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {$ref: '#/components/schemas/SuccessResponse'},
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        description: 'Detalles de la solicitud de cambio creada'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        400: {$ref: '#/components/responses/BadRequest'},
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        409: {$ref: '#/components/responses/Conflict'},
        422: {$ref: '#/components/responses/ValidationError'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },

  '/admin/api/loan/system-config/{id}': {
    get: {
      tags: ['System Global Config - Admin'],
      summary: 'Obtiene configuración por ID',
      description: 'Obtiene una versión específica de configuración por su ID',
      security: [{BearerAuth: []}],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'ID de la configuración',
          required: true,
          schema: {$ref: '#/components/schemas/UUID'}
        }
      ],
      responses: {
        200: {
          description: 'Configuración obtenida exitosamente',
          content: {'application/json': {schema: {$ref: '#/components/schemas/SystemGlobalConfigResponse'}}}
        },
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        404: {$ref: '#/components/responses/NotFound'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },

  // ==================== APROBACIÓN/RECHAZO DE CAMBIOS (SEGUNDO ADMIN) ====================

  '/admin/api/loan/system-config/change-requests/{changeRequestId}/approve': {
    post: {
      tags: ['System Global Config - Admin'],
      summary: 'Aprueba solicitud de cambio de configuración (segundo admin)',
      description: 'Aprueba una solicitud de cambio y aplica los cambios a la configuración global. Requiere ser un administrador diferente al solicitante. Crea nueva versión o activa versión específica según el tipo de cambio.',
      operationId: 'approveConfigChangeRequest',
      security: [{BearerAuth: []}],
      parameters: [
        {
          name: 'changeRequestId',
          in: 'path',
          description: 'ID de la solicitud de cambio',
          required: true,
          schema: {$ref: '#/components/schemas/UUID'}
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApproveConfigChangeRequestBody'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Solicitud aprobada y cambios aplicados exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApproveConfigChangeResponse'
              }
            }
          }
        },
        400: {$ref: '#/components/responses/BadRequest'},
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {
          description: 'Forbidden - No puedes aprobar tus propios cambios',
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
  },

  '/admin/api/loan/system-config/change-requests/{changeRequestId}/reject': {
    post: {
      tags: ['System Global Config - Admin'],
      summary: 'Rechaza solicitud de cambio de configuración (segundo admin)',
      description: 'Rechaza una solicitud de cambio sin aplicar cambios. Requiere ser un administrador diferente al solicitante y proporcionar notas de rechazo (mínimo 10 caracteres).',
      operationId: 'rejectConfigChangeRequest',
      security: [{BearerAuth: []}],
      parameters: [
        {
          name: 'changeRequestId',
          in: 'path',
          description: 'ID de la solicitud de cambio',
          required: true,
          schema: {$ref: '#/components/schemas/UUID'}
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RejectConfigChangeRequestBody'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Solicitud rechazada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RejectConfigChangeResponse'
              }
            }
          }
        },
        400: {$ref: '#/components/responses/BadRequest'},
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {
          description: 'Forbidden - No puedes rechazar tus propios cambios',
          content: {
            'application/json': {
              schema: {$ref: '#/components/schemas/ErrorResponse'}
            }
          }
        },
        404: {$ref: '#/components/responses/NotFound'},
        422: {$ref: '#/components/responses/ValidationError'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  }
};

module.exports = systemGlobalConfigPaths;