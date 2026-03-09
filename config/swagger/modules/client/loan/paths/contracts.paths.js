'use strict';

/**
 * @fileoverview Paths de OpenAPI/Swagger para el módulo de Contratos (CLIENT)
 * @module contracts.client.paths
 * @description Documentación de endpoints del cliente para consulta y gestión de sus contratos
 */

module.exports = {
  /**
   * GET /client/api/loan/contracts
   * Listar mis contratos (aplicante o codeudor)
   */
  '/client/api/loan/contracts': {
    get: {
      tags: ['Contracts - Client'],
      summary: 'Listar mis contratos',
      description: 'Obtiene un listado paginado de los contratos del usuario autenticado, ya sea como aplicante o como codeudor. Los contratos en estado "failed" se muestran como "Procesando" para el cliente.',
      operationId: 'listMyContracts',
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
            default: 10,
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
              example: {
                success: true,
                message: 'Contratos obtenidos exitosamente',
                data: [
                  {
                    contract_id: '550e8400-e29b-41d4-a716-446655440000',
                    offer_id: '660e8400-e29b-41d4-a716-446655440000',
                    status: 'pending_signature',
                    is_cosigner: false,
                    expires_at: '2025-02-20T23:59:59.000Z',
                    signed_at: null,
                    created_at: '2025-02-06T10:30:00.000Z',
                    offer_info: {
                      approved_amount: 5000000,
                      term_months: 12,
                      product_name: 'Préstamo Personal',
                    },
                    display_status: 'Pendiente de firma',
                    is_expired: false,
                    can_sign: true,
                  },
                ],
                metadata: {
                  $ref: '#/components/schemas/CompleteMetadata'
                }
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
              example: {
                success: false,
                message: 'Errores de validación',
                errors: [
                  {
                    field: 'page',
                    message: 'page debe ser un número entero mayor a 0',
                  },
                ],
              },
            },
          },
        },
        401: {
          description: 'No autenticado - Token inválido o expirado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'Token de autenticación inválido o expirado',
                error: {
                  code: 'UNAUTHORIZED',
                },
              },
            },
          },
        },
      },
    },
  },

  /**
   * GET /client/api/loan/contracts/{contract_id}
   * Obtener detalle de mi contrato
   */
  '/client/api/loan/contracts/{contract_id}': {
    get: {
      tags: ['Contracts - Client'],
      summary: 'Obtener detalle de mi contrato',
      description: 'Obtiene información detallada de un contrato específico del usuario autenticado. Incluye la URL de firma si está pendiente de firma, o la URL del PDF firmado si ya fue firmado. NO incluye información técnica de ZapSign ni logs de ejecución (eso es solo para admin).',
      operationId: 'getMyContractDetail',
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
                    $ref: '#/components/schemas/ContractDetail',
                  },
                },
              },
              example: {
                success: true,
                message: 'Detalle de contrato obtenido exitosamente',
                data: {
                  contract_id: '550e8400-e29b-41d4-a716-446655440000',
                  offer_id: '660e8400-e29b-41d4-a716-446655440000',
                  status: 'pending_signature',
                  is_cosigner: false,
                  expires_at: '2025-02-20T23:59:59.000Z',
                  signed_at: null,
                  created_at: '2025-02-06T10:30:00.000Z',
                  display_status: 'Pendiente de firma',
                  is_expired: false,
                  can_sign: true,
                  sign_url: 'https://app.zapsign.com.br/sign/abc123xyz',
                  signer_info: {
                    name: 'Juan Pérez González',
                    email: 'juan.perez@example.com',
                    is_cosigner: false,
                  },
                  offer_details: {
                    offer_id: '660e8400-e29b-41d4-a716-446655440000',
                    approved_amount: 5000000,
                    term_months: 12,
                    monthly_payment: 450000,
                    interest_rate: 2.5,
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
              example: {
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
          description: 'No autorizado - El contrato no pertenece al usuario',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'No tienes permiso para ver este contrato',
                error: {
                  code: 'FORBIDDEN',
                },
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
              example: {
                success: false,
                message: 'Contrato no encontrado',
                error: {
                  code: 'NOT_FOUND',
                },
              },
            },
          },
        },
      },
    },
  },

  /**
   * POST /client/api/loan/contracts/{contract_id}/cancel
   * Cancelar mi contrato
   */
  '/client/api/loan/contracts/{contract_id}/cancel': {
    post: {
      tags: ['Contracts - Client'],
      summary: 'Cancelar mi contrato',
      description: 'Permite al usuario cancelar su propio contrato si está en estado pendiente, procesando o pendiente de firma. No se pueden cancelar contratos ya firmados, expirados o cancelados.',
      operationId: 'cancelMyContract',
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
              example: {
                success: true,
                message: 'Contrato cancelado exitosamente',
                data: {
                  contract_id: '550e8400-e29b-41d4-a716-446655440000',
                  status: 'cancelled',
                  cancelled_at: '2025-02-06T16:00:00.000Z',
                  message: 'Contrato cancelado exitosamente',
                },
              },
            },
          },
        },
        400: {
          description: 'No se puede cancelar (estado inválido o UUID inválido)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              examples: {
                invalidStatus: {
                  summary: 'Estado inválido para cancelación',
                  value: {
                    success: false,
                    message: 'Este contrato no se puede cancelar. Solo puedes cancelar contratos pendientes o en proceso.',
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
          description: 'No autorizado - El contrato no pertenece al usuario',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse',
              },
              example: {
                success: false,
                message: 'No tienes permiso para cancelar este contrato',
                error: {
                  code: 'FORBIDDEN',
                },
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
              example: {
                success: false,
                message: 'Contrato no encontrado',
                error: {
                  code: 'NOT_FOUND',
                },
              },
            },
          },
        },
      },
    },
  },
};