'use strict';

/**
 * @fileoverview Schemas de OpenAPI/Swagger para el módulo de Contratos
 * @module contracts.schemas
 * @description Definiciones compartidas de esquemas para endpoints de contratos (admin y client)
 */

/**
 * ==================== SCHEMAS DE RESPONSE ====================
 */

const ContractListItemSchema = {
  type: 'object',
  properties: {
    contract_id: {
      type: 'string',
      format: 'uuid',
      description: 'ID único del contrato',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    offer_id: {
      type: 'string',
      format: 'uuid',
      description: 'ID de la oferta asociada',
      example: '660e8400-e29b-41d4-a716-446655440000',
    },
    status: {
      type: 'string',
      enum: ['pending', 'processing', 'pending_signature', 'signed', 'failed', 'expired', 'cancelled'],
      description: 'Estado actual del contrato',
      example: 'pending_signature',
    },
    is_cosigner: {
      type: 'boolean',
      description: 'Indica si el contrato es para el codeudor',
      example: false,
    },
    expires_at: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description: 'Fecha de expiración del contrato',
      example: '2025-02-20T23:59:59.000Z',
    },
    signed_at: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      description: 'Fecha en que se firmó el contrato',
      example: null,
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      description: 'Fecha de creación del contrato',
      example: '2025-02-06T10:30:00.000Z',
    },
    offer_info: {
      type: 'object',
      nullable: true,
      description: 'Información básica de la oferta',
      properties: {
        approved_amount: {
          type: 'number',
          description: 'Monto aprobado del préstamo',
          example: 5000000,
        },
        term_months: {
          type: 'integer',
          description: 'Plazo en meses',
          example: 12,
        },
        product_name: {
          type: 'string',
          description: 'Nombre del producto de préstamo',
          example: 'Préstamo Personal',
        },
      },
    },
    display_status: {
      type: 'string',
      description: 'Estado visual para mostrar al cliente',
      example: 'Pendiente de firma',
    },
    is_expired: {
      type: 'boolean',
      description: 'Indica si el contrato está expirado',
      example: false,
    },
    can_sign: {
      type: 'boolean',
      description: 'Indica si el contrato se puede firmar actualmente',
      example: true,
    },
  },
};

const ContractDetailSchema = {
  allOf: [
    { $ref: '#/components/schemas/ContractListItem' },
    {
      type: 'object',
      properties: {
        sign_url: {
          type: 'string',
          format: 'uri',
          nullable: true,
          description: 'URL para firmar el contrato (solo si status es pending_signature)',
          example: 'https://app.zapsign.com.br/sign/abc123',
        },
        contract_url: {
          type: 'string',
          format: 'uri',
          nullable: true,
          description: 'URL del PDF firmado (solo si status es signed)',
          example: 'https://s3.amazonaws.com/contracts/contract-123.pdf',
        },
        signer_info: {
          type: 'object',
          nullable: true,
          description: 'Información del firmante',
          properties: {
            name: {
              type: 'string',
              description: 'Nombre completo del firmante',
              example: 'Juan Pérez González',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Email del firmante',
              example: 'juan.perez@example.com',
            },
            is_cosigner: {
              type: 'boolean',
              description: 'Indica si es el codeudor',
              example: false,
            },
          },
        },
        offer_details: {
          type: 'object',
          nullable: true,
          description: 'Detalles completos de la oferta',
          properties: {
            offer_id: {
              type: 'string',
              format: 'uuid',
              example: '660e8400-e29b-41d4-a716-446655440000',
            },
            approved_amount: {
              type: 'number',
              example: 5000000,
            },
            term_months: {
              type: 'integer',
              example: 12,
            },
            monthly_payment: {
              type: 'number',
              example: 450000,
            },
            interest_rate: {
              type: 'number',
              example: 2.5,
            },
          },
        },
      },
    },
  ],
};

const ContractAdminDetailSchema = {
  allOf: [
    { $ref: '#/components/schemas/ContractDetail' },
    {
      type: 'object',
      properties: {
        zapsign_info: {
          type: 'object',
          description: 'Información técnica de ZapSign (solo admin)',
          properties: {
            doc_id: {
              type: 'string',
              nullable: true,
              description: 'ID del documento en ZapSign',
              example: 'doc_abc123xyz',
            },
            signer_token: {
              type: 'string',
              nullable: true,
              description: 'Token del firmante en ZapSign',
              example: 'signer_token_xyz',
            },
            original_file: {
              type: 'string',
              format: 'uri',
              nullable: true,
              description: 'URL del archivo original en ZapSign',
              example: 'https://zapsign.com/files/original.pdf',
            },
            status: {
              type: 'string',
              description: 'Estado real del contrato (no el display_status)',
              example: 'failed',
            },
          },
        },
        retry_info: {
          type: 'object',
          description: 'Información de reintentos (solo admin)',
          properties: {
            retry_count: {
              type: 'integer',
              description: 'Número de reintentos realizados',
              example: 2,
            },
            last_error: {
              type: 'string',
              nullable: true,
              description: 'Último mensaje de error',
              example: 'Connection timeout to ZapSign API',
            },
            can_retry: {
              type: 'boolean',
              description: 'Indica si se puede reintentar (siempre true para admin si status es failed)',
              example: true,
            },
          },
        },
        execution_logs: {
          type: 'array',
          description: 'Logs de ejecución del contrato (solo admin)',
          items: {
            $ref: '#/components/schemas/ContractExecutionLog',
          },
        },
        cancelled_at: {
          type: 'string',
          format: 'date-time',
          nullable: true,
          description: 'Fecha de cancelación',
          example: null,
        },
        updated_at: {
          type: 'string',
          format: 'date-time',
          description: 'Última actualización',
          example: '2025-02-06T15:30:00.000Z',
        },
      },
    },
  ],
};

const ContractExecutionLogSchema = {
  type: 'object',
  properties: {
    log_id: {
      type: 'string',
      format: 'uuid',
      description: 'ID único del log',
      example: '770e8400-e29b-41d4-a716-446655440000',
    },
    execution_type: {
      type: 'string',
      enum: ['automatic', 'manual', 'webhook'],
      description: 'Tipo de ejecución (automatic: worker automático, manual: reintento manual del admin, webhook: procesamiento de webhook)',
      example: 'automatic',
    },
    attempt_number: {
      type: 'integer',
      description: 'Número de intento (se incrementa en cada reintento)',
      example: 2,
    },
    status: {
      type: 'string',
      enum: ['success', 'failed', 'pending'],
      description: 'Estado del intento',
      example: 'failed',
    },
    error_message: {
      type: 'string',
      nullable: true,
      description: 'Mensaje de error si el status es failed',
      example: 'ZapSign API connection timeout',
    },
    executed_at: {
      type: 'string',
      format: 'date-time',
      description: 'Timestamp de la ejecución (se actualiza en cada reintento)',
      example: '2025-02-06T14:25:00.000Z',
    },
    executed_by: {
      type: 'object',
      nullable: true,
      description: 'Usuario que ejecutó (null si fue automático)',
      properties: {
        user_id: {
          type: 'string',
          format: 'uuid',
          example: '880e8400-e29b-41d4-a716-446655440000',
        },
        email: {
          type: 'string',
          format: 'email',
          example: 'admin@example.com',
        },
      },
    },
  },
};

const ContractCancelResponseSchema = {
  type: 'object',
  properties: {
    contract_id: {
      type: 'string',
      format: 'uuid',
      description: 'ID del contrato cancelado',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    status: {
      type: 'string',
      enum: ['cancelled'],
      description: 'Nuevo estado del contrato',
      example: 'cancelled',
    },
    cancelled_at: {
      type: 'string',
      format: 'date-time',
      description: 'Fecha y hora de cancelación',
      example: '2025-02-06T16:00:00.000Z',
    },
    message: {
      type: 'string',
      description: 'Mensaje de confirmación',
      example: 'Contrato cancelado exitosamente',
    },
  },
};

const ContractRetryResponseSchema = {
  type: 'object',
  properties: {
    contract_id: {
      type: 'string',
      format: 'uuid',
      description: 'ID del contrato',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    message: {
      type: 'string',
      description: 'Mensaje informativo',
      example: 'Reintento iniciado exitosamente. Verifica el estado en unos minutos.',
    },
    status: {
      type: 'string',
      enum: ['processing'],
      description: 'Nuevo estado del contrato',
      example: 'processing',
    },
    attempt_number: {
      type: 'integer',
      description: 'Número de intento que se está ejecutando',
      example: 4,
    },
  },
};

const ContractStatsSchema = {
  type: 'object',
  properties: {
    total: {
      type: 'integer',
      description: 'Total de contratos en el sistema',
      example: 150,
    },
    by_status: {
      type: 'object',
      description: 'Cantidad de contratos por estado',
      properties: {
        pending: { type: 'integer', example: 5 },
        processing: { type: 'integer', example: 3 },
        pending_signature: { type: 'integer', example: 20 },
        signed: { type: 'integer', example: 100 },
        failed: { type: 'integer', example: 8 },
        expired: { type: 'integer', example: 10 },
        cancelled: { type: 'integer', example: 4 },
      },
    },
    retry_stats: {
      type: 'object',
      description: 'Estadísticas de reintentos',
      properties: {
        failed_total: {
          type: 'integer',
          description: 'Total de contratos fallidos',
          example: 8,
        },
        failed_1_attempt: {
          type: 'integer',
          description: 'Contratos fallidos con 1 intento',
          example: 3,
        },
        failed_2_attempts: {
          type: 'integer',
          description: 'Contratos fallidos con 2 intentos',
          example: 2,
        },
        failed_3_attempts: {
          type: 'integer',
          description: 'Contratos fallidos con 3 intentos (límite worker)',
          example: 2,
        },
        failed_more_than_3: {
          type: 'integer',
          description: 'Contratos fallidos con más de 3 intentos (reintentos admin)',
          example: 1,
        },
      },
    },
  },
};

const PaginatedContractsResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      example: true,
    },
    message: {
      type: 'string',
      example: 'Contratos obtenidos exitosamente',
    },
    data: {
      type: 'array',
      items: {
        $ref: '#/components/schemas/ContractListItem',
      },
    },
    metadata: {
      $ref: '#/components/schemas/PaginationMetadata',
    },
  },
};

const PaginationMetadataSchema = {
  type: 'object',
  properties: {
    currentPage: {
      type: 'integer',
      description: 'Página actual',
      example: 1,
    },
    pageSize: {
      type: 'integer',
      description: 'Cantidad de items por página',
      example: 20,
    },
    totalItems: {
      type: 'integer',
      description: 'Total de items',
      example: 150,
    },
    totalPages: {
      type: 'integer',
      description: 'Total de páginas',
      example: 8,
    },
    hasNextPage: {
      type: 'boolean',
      description: 'Indica si hay página siguiente',
      example: true,
    },
    hasPreviousPage: {
      type: 'boolean',
      description: 'Indica si hay página anterior',
      example: false,
    },
    sortBy: {
      type: 'string',
      description: 'Campo por el cual se ordenó',
      example: 'created_at',
    },
    order: {
      type: 'string',
      enum: ['ASC', 'DESC'],
      description: 'Orden de los resultados',
      example: 'DESC',
    },
  },
};

/**
 * ==================== SCHEMAS DE ERRORES ====================
 */

const ErrorResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      example: false,
    },
    message: {
      type: 'string',
      example: 'Contrato no encontrado',
    },
    error: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          example: 'NOT_FOUND',
        },
        details: {
          type: 'object',
          nullable: true,
        },
      },
    },
  },
};

const ValidationErrorResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      example: false,
    },
    message: {
      type: 'string',
      example: 'Errores de validación',
    },
    errors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: {
            type: 'string',
            example: 'contract_id',
          },
          message: {
            type: 'string',
            example: 'contract_id debe ser un UUID válido',
          },
        },
      },
    },
  },
};

/**
 * ==================== EXPORTS ====================
 */

module.exports = ContractListItemSchema;