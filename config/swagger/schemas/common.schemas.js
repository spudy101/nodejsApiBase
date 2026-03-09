/**
 * Schemas comunes reutilizables
 * ✅ ACTUALIZADO: Incluye correlationId en respuestas de error
 */

const commonSchemas = {
  // ==================== RESPONSE BASE ====================

  SuccessResponse: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'timestamp'],
    properties: {
      success: {
        type: 'boolean',
        example: true,
        description: 'Indica si la operación fue exitosa'
      },
      statusCode: {
        type: 'integer',
        example: 200,
        description: 'Código de estado HTTP'
      },
      message: {
        type: 'string',
        example: 'Operación exitosa',
        description: 'Mensaje descriptivo de la operación'
      },
      data: {
        type: 'object',
        description: 'Datos de la respuesta (varía según endpoint)',
        nullable: true
      },
      metadata: {
        type: 'object',
        description: 'Metadatos adicionales (opcional)',
        nullable: true
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Timestamp de la respuesta'
      }
    }
  },

  ErrorResponse: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'timestamp'],
    properties: {
      success: {
        type: 'boolean',
        example: false,
        description: 'Indica si la operación fue exitosa (siempre false para errores)'
      },
      statusCode: {
        type: 'integer',
        example: 400,
        description: 'Código de estado HTTP'
      },
      message: {
        type: 'string',
        example: 'Error en la solicitud',
        description: 'Mensaje descriptivo del error'
      },
      errorCode: {
        type: 'string',
        example: 'BAD_REQUEST',
        nullable: true,
        description: 'Código de error específico',
        enum: [
          'BAD_REQUEST',
          'UNAUTHORIZED',
          'FORBIDDEN',
          'NOT_FOUND',
          'CONFLICT',
          'VALIDATION_ERROR',
          'RATE_LIMIT',
          'INTERNAL_ERROR',
          'SERVER_ERROR',
          'DATABASE_ERROR'
        ]
      },
      errors: {
        type: 'object',
        nullable: true,
        description: 'Detalles adicionales del error (incluye correlationId)',
        properties: {
          correlationId: {
            type: 'string',
            example: 'req-1737575485123-a1b2c3d4',
            description: 'ID de correlación para rastrear el error en logs'
          }
        },
        additionalProperties: true
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Timestamp del error'
      }
    }
  },

  ValidationErrorResponse: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'errorCode', 'errors', 'timestamp'],
    properties: {
      success: {
        type: 'boolean',
        example: false,
        description: 'Indica si la operación fue exitosa (siempre false para errores)'
      },
      statusCode: {
        type: 'integer',
        example: 422,
        description: 'Código de estado HTTP'
      },
      message: {
        type: 'string',
        example: 'Error de validación',
        description: 'Mensaje descriptivo del error'
      },
      errorCode: {
        type: 'string',
        example: 'VALIDATION_ERROR',
        description: 'Código de error específico'
      },
      errors: {
        oneOf: [
          {
            type: 'array',
            description: 'Lista de errores de validación',
            items: {
              type: 'object',
              required: ['field', 'message'],
              properties: {
                field: {
                  type: 'string',
                  example: 'email',
                  description: 'Campo que causó el error'
                },
                message: {
                  type: 'string',
                  example: 'El email es requerido',
                  description: 'Mensaje de error específico del campo'
                }
              }
            }
          },
          {
            type: 'object',
            description: 'Detalles adicionales (puede incluir correlationId)',
            properties: {
              correlationId: {
                type: 'string',
                example: 'req-1737575485123-a1b2c3d4',
                description: 'ID de correlación para rastrear el error'
              }
            },
            additionalProperties: true
          }
        ]
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Timestamp del error'
      }
    }
  },

  // ==================== PAGINATION ====================

  PaginationMetadata: {
    type: 'object',
    required: ['currentPage', 'pageSize', 'totalItems', 'totalPages', 'hasNextPage', 'hasPreviousPage'],
    properties: {
      currentPage: {
        type: 'integer',
        example: 1,
        minimum: 1,
        description: 'Página actual'
      },
      pageSize: {
        type: 'integer',
        example: 10,
        minimum: 1,
        maximum: 100,
        description: 'Cantidad de elementos por página'
      },
      totalItems: {
        type: 'integer',
        example: 100,
        minimum: 0,
        description: 'Total de elementos'
      },
      totalPages: {
        type: 'integer',
        example: 10,
        minimum: 0,
        description: 'Total de páginas'
      },
      hasNextPage: {
        type: 'boolean',
        example: true,
        description: 'Indica si existe página siguiente'
      },
      hasPreviousPage: {
        type: 'boolean',
        example: false,
        description: 'Indica si existe página anterior'
      }
    }
  },

  CompleteMetadata: {
    type: 'object',
    properties: {
      pagination: {
        $ref: '#/components/schemas/PaginationMetadata'
      },
      filters: {
        type: 'object',
        nullable: true,
        description: 'Filtros aplicados a la consulta',
        additionalProperties: true,
        example: {
          isActive: true,
          status: 'active'
        }
      },
      sort: {
        type: 'object',
        nullable: true,
        description: 'Ordenamiento aplicado',
        properties: {
          sortBy: {
            type: 'string',
            example: 'createdAt',
            description: 'Campo por el cual se ordenó'
          },
          order: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            example: 'DESC',
            description: 'Dirección del ordenamiento'
          }
        }
      }
    }
  },

  PaginatedResponse: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'data', 'metadata', 'timestamp'],
    properties: {
      success: {
        type: 'boolean',
        example: true,
        description: 'Indica si la operación fue exitosa'
      },
      statusCode: {
        type: 'integer',
        example: 200,
        description: 'Código de estado HTTP'
      },
      message: {
        type: 'string',
        example: 'Datos obtenidos exitosamente',
        description: 'Mensaje descriptivo de la operación'
      },
      data: {
        type: 'array',
        description: 'Lista de elementos (varía según endpoint)',
        items: {
          type: 'object',
          description: 'Estructura del elemento (definir en cada endpoint)'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Timestamp de la respuesta'
      }
    }
  },

  // ==================== TIPOS COMUNES ====================

  UUID: {
    type: 'string',
    format: 'uuid',
    pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Identificador único universal'
  },

  CorrelationId: {
    type: 'string',
    pattern: '^req-\\d{13}-[a-f0-9]{8}$',
    example: 'req-1737575485123-a1b2c3d4',
    description: 'ID de correlación para rastrear requests en logs'
  },

  Timestamp: {
    type: 'string',
    format: 'date-time',
    example: '2024-01-17T10:30:00.000Z',
    description: 'Timestamp en formato ISO 8601'
  },

  Email: {
    type: 'string',
    format: 'email',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    example: 'usuario@example.com',
    description: 'Dirección de correo electrónico válida'
  },

  Date: {
    type: 'string',
    format: 'date',
    pattern: '^\\d{4}-\\d{2}-\\d{2}$',
    example: '2024-01-17',
    description: 'Fecha en formato YYYY-MM-DD'
  },

  Password: {
    type: 'string',
    format: 'password',
    minLength: 8,
    maxLength: 128,
    example: 'Password123!',
    description: 'Contraseña (mínimo 8 caracteres, debe contener mayúscula, minúscula y número)'
  }
};

module.exports = commonSchemas;