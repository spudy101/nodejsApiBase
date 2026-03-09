'use strict';

/**
 * @fileoverview Paths de OpenAPI/Swagger para el módulo de Contratos (ADMIN)
 * @module contracts.admin.paths
 * @description Documentación de endpoints administrativos para gestión de contratos
 */

module.exports = {
  /**
   * GET /admin/api/loan/contracts/stats
   * Obtener estadísticas de contratos
   */
  '/admin/api/loan/contracts/stats': {
    get: {
      tags: ['Contracts - Admin'],
      summary: 'Obtener estadísticas de contratos',
      description: 'Obtiene estadísticas completas del sistema de contratos incluyendo totales por estado y estadísticas de reintentos. Solo accesible para administradores.',
      operationId: 'getContractStats',
      security: [
        {
          bearerAuth: [],
        },
      ],
      responses: {
        200: {
          description: 'Estadísticas obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Estadísticas obtenidas exitosamente',
                  },
                  data: {
                    $ref: '#/components/schemas/ContractStats',
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'No autenticado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        403: {
          description: 'No autorizado - Se requiere rol de administrador',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },

  /**
   * GET /admin/api/loan/contracts
   * Listar todos los contratos (con filtros y paginación)
   */
  '/admin/api/loan/contracts': {
    get: {
      tags: ['Contracts - Admin'],
      summary: 'Listar todos los contratos',
      description: 'Obtiene un listado paginado de todos los contratos del sistema con capacidad de filtrado por estado, oferta, persona, etc. Solo accesible para administradores.',
      operationId: 'listAllContracts',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Cantidad de items por página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Campo por el cual ordenar',
          required: false,
          schema: {
            type: 'string',
            default: 'created_at',
          },
        },
        {
          name: 'order',
          in: 'query',
          description: 'Orden de los resultados',
          required: false,
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC',
          },
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filtrar por estado del contrato',
          required: false,
          schema: {
            type: 'string',
            enum: ['pending', 'processing', 'pending_signature', 'signed', 'failed', 'expired', 'cancelled'],
          },
        },
        {
          name: 'offer_id',
          in: 'query',
          description: 'Filtrar por ID de oferta',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
      ],
      responses: {
        200: {
          description: 'Contratos obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PaginatedContractsResponse',
              },
            },
          },
        },
        400: {
          description: 'Parámetros de consulta inválidos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse',
              },
            },
          },
        },
        401: {
          description: 'No autenticado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        403: {
          description: 'No autorizado - Se requiere rol de administrador',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },

  /**
   * GET /admin/api/loan/contracts/{contract_id}
   * Obtener detalle completo de un contrato (admin)
   */
  '/admin/api/loan/contracts/{contract_id}': {
    get: {
      tags: ['Contracts - Admin'],
      summary: 'Obtener detalle completo de un contrato',
      description: 'Obtiene información detallada de un contrato específico incluyendo información técnica de ZapSign, logs de ejecución y estadísticas de reintentos. Solo accesible para administradores.',
      operationId: 'getContractDetailAdmin',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'contract_id',
          in: 'path',
          description: 'ID del contrato',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
      ],
      responses: {
        200: {
          description: 'Detalle de contrato obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Detalle de contrato obtenido exitosamente',
                  },
                  data: {
                    $ref: '#/components/schemas/ContractAdminDetail',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'contract_id inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse',
              },
            },
          },
        },
        401: {
          description: 'No autenticado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        403: {
          description: 'No autorizado - Se requiere rol de administrador',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        404: {
          description: 'Contrato no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },

  /**
   * POST /admin/api/loan/contracts/{contract_id}/retry
   * Reintentar creación de contrato fallido (REINTENTOS INFINITOS)
   */
  '/admin/api/loan/contracts/{contract_id}/retry': {
    post: {
      tags: ['Contracts - Admin'],
      summary: 'Reintentar creación de contrato fallido',
      description: 'Reintenta la creación de un contrato que falló previamente. Los administradores tienen REINTENTOS INFINITOS (sin límite), a diferencia del worker automático que tiene máximo 3 intentos. Solo puede reintentar contratos en estado "failed".',
      operationId: 'retryContractCreation',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'contract_id',
          in: 'path',
          description: 'ID del contrato a reintentar',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
      ],
      responses: {
        200: {
          description: 'Reintento iniciado exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Reintento iniciado exitosamente. Verifica el estado en unos minutos.',
                  },
                  data: {
                    $ref: '#/components/schemas/ContractRetryResponse',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'No se puede reintentar (estado inválido o parámetros incorrectos)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              examples: {
                invalidStatus: {
                  summary: 'Estado inválido para reintento',
                  value: {
                    success: false,
                    message: 'Este contrato no se puede reintentar. Solo se pueden reintentar contratos en estado "failed".',
                    error: {
                      code: 'BAD_REQUEST',
                    },
                  },
                },
                invalidUUID: {
                  summary: 'UUID inválido',
                  value: {
                    success: false,
                    message: 'Errores de validación',
                    errors: [
                      {
                        field: 'contract_id',
                        message: 'contract_id debe ser un UUID válido',
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'No autenticado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        403: {
          description: 'No autorizado - Se requiere rol de administrador',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        404: {
          description: 'Contrato no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },

  /**
   * POST /admin/api/loan/contracts/{contract_id}/cancel
   * Cancelar contrato
   */
  '/admin/api/loan/contracts/{contract_id}/cancel': {
    post: {
      tags: ['Contracts - Admin'],
      summary: 'Cancelar contrato',
      description: 'Cancela un contrato que está en estado pendiente, procesando o pendiente de firma. Solo accesible para administradores.',
      operationId: 'cancelContractAdmin',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'contract_id',
          in: 'path',
          description: 'ID del contrato a cancelar',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
      ],
      responses: {
        200: {
          description: 'Contrato cancelado exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Contrato cancelado exitosamente',
                  },
                  data: {
                    $ref: '#/components/schemas/ContractCancelResponse',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'No se puede cancelar (estado inválido)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Este contrato no se puede cancelar. Solo se pueden cancelar contratos pendientes o en proceso.',
                error: {
                  code: 'BAD_REQUEST',
                },
              },
            },
          },
        },
        401: {
          description: 'No autenticado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        403: {
          description: 'No autorizado - Se requiere rol de administrador',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        404: {
          description: 'Contrato no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },

  /**
   * GET /admin/api/loan/contracts/{contract_id}/logs
   * Obtener logs de ejecución de un contrato
   */
  '/admin/api/loan/contracts/{contract_id}/logs': {
    get: {
      tags: ['Contracts - Admin'],
      summary: 'Obtener logs de ejecución de un contrato',
      description: 'Obtiene el historial de logs de ejecución de un contrato específico, mostrando todos los intentos de creación, reintentos y su estado. Solo accesible para administradores. NOTA: Ahora cada contrato tiene 1 solo log que se actualiza con cada reintento.',
      operationId: 'getContractLogs',
      security: [
        {
          bearerAuth: [],
        },
      ],
      parameters: [
        {
          name: 'contract_id',
          in: 'path',
          description: 'ID del contrato',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
          },
        },
        {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Cantidad de items por página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Campo por el cual ordenar',
          required: false,
          schema: {
            type: 'string',
            default: 'executed_at',
          },
        },
        {
          name: 'order',
          in: 'query',
          description: 'Orden de los resultados',
          required: false,
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC',
          },
        },
      ],
      responses: {
        200: {
          description: 'Logs obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  message: {
                    type: 'string',
                    example: 'Logs obtenidos exitosamente',
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ContractExecutionLog',
                    },
                  },
                  metadata: {
                    $ref: '#/components/schemas/PaginationMetadata',
                  },
                },
              },
            },
          },
        },
        400: {
          description: 'Parámetros inválidos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse',
              },
            },
          },
        },
        401: {
          description: 'No autenticado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
        403: {
          description: 'No autorizado - Se requiere rol de administrador',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
            },
          },
        },
      },
    },
  },
};