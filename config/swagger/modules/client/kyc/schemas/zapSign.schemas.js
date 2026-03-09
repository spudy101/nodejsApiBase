/**
 * ========================================
 * SWAGGER SCHEMAS - KYC ZAPSIGN MODULE
 * ========================================
 * Definiciones de esquemas para documentación Swagger
 * Módulo: Validación de identidad con ZapSign
 */

const zapSignSchemas = {
  // ==================== REQUEST SCHEMAS ====================

  /**
   * Request para generar URL de validación
   * POST /client/api/kyc/zapsign/generate-url
   */
  GenerateUrlRequest: {
    type: 'object',
    required: ['fullName'],
    properties: {
      fullName: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        pattern: '^[a-záéíóúñA-ZÁÉÍÓÚÑ\\s\'-]+$',
        description: 'Nombre completo del usuario (nombre y apellido mínimo). Solo letras, espacios, guiones y apóstrofes permitidos.',
        example: 'Juan Carlos Pérez González'
      },
      channel: {
        type: 'string',
        enum: ['web', 'mobile'],
        default: 'web',
        description: 'Canal desde donde se solicita la validación',
        example: 'web'
      }
    },
    example: {
      fullName: 'Juan Carlos Pérez González',
      channel: 'web'
    }
  },

  /**
   * Payload del webhook de ZapSign
   * POST /client/api/kyc/zapsign/webhook
   */
  WebhookPayload: {
    type: 'object',
    required: ['event_type', 'token', 'status'],
    properties: {
      event_type: {
        type: 'string',
        enum: [
          'doc_created',
          'doc_signed',
          'doc_viewed',
          'signer_viewed',
          'signer_authentication_failed',
          'doc_refused',
          'doc_expired',
          'doc_deleted'
        ],
        description: 'Tipo de evento del webhook',
        example: 'doc_signed'
      },
      token: {
        type: 'string',
        description: 'Token del documento en ZapSign',
        example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
      },
      status: {
        type: 'string',
        description: 'Estado actual del documento en ZapSign',
        example: 'signed'
      },
      signers: {
        type: 'array',
        description: 'Lista de firmantes (presente cuando event_type es doc_signed)',
        items: {
          type: 'object',
          properties: {
            token: {
              type: 'string',
              description: 'Token del firmante',
              example: 'signer-token-123'
            },
            status: {
              type: 'string',
              description: 'Estado del firmante',
              example: 'signed'
            },
            document_ocr: {
              type: 'object',
              description: 'Datos extraídos del documento por OCR',
              properties: {
                name: {
                  type: 'string',
                  description: 'Nombre(s) extraído del documento',
                  example: 'Juan Carlos'
                },
                last_name: {
                  type: 'string',
                  description: 'Apellido(s) extraído del documento',
                  example: 'Pérez González'
                },
                date_of_birth: {
                  type: 'string',
                  format: 'date',
                  description: 'Fecha de nacimiento extraída del documento',
                  example: '1990-05-15'
                },
                document_number: {
                  type: 'string',
                  description: 'Número de documento extraído',
                  example: '12345678-9'
                }
              }
            }
          }
        }
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de creación del evento',
        example: '2024-01-17T10:30:00.000Z'
      }
    },
    example: {
      event_type: 'doc_signed',
      token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      status: 'signed',
      signers: [
        {
          token: 'signer-token-123',
          status: 'signed',
          document_ocr: {
            name: 'Juan Carlos',
            last_name: 'Pérez González',
            date_of_birth: '1990-05-15',
            document_number: '12345678-9'
          }
        }
      ],
      created_at: '2024-01-17T10:30:00.000Z'
    }
  },

  // ==================== RESPONSE SCHEMAS ====================

  /**
   * Response de generación de URL exitosa
   */
  GenerateUrlResponse: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
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
        example: 'URL de validación generada exitosamente',
        description: 'Mensaje descriptivo de la operación'
      },
      data: {
        type: 'object',
        required: ['validation', 'zapSign'],
        properties: {
          validation: {
            type: 'object',
            description: 'Información de la validación creada en la BD',
            required: ['id', 'status', 'documentUrl', 'initiatedAt'],
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'ID único de la validación',
                example: '123e4567-e89b-12d3-a456-426614174000'
              },
              status: {
                type: 'string',
                enum: ['pending', 'signed', 'failed', 'cancelled', 'expired'],
                description: 'Estado actual de la validación',
                example: 'pending'
              },
              documentUrl: {
                type: 'string',
                format: 'uri',
                description: 'URL del documento de validación (link que debe abrir el usuario)',
                example: 'https://app.zapsign.com.br/verificacao/a1b2c3d4'
              },
              initiatedAt: {
                type: 'string',
                format: 'date-time',
                description: 'Fecha y hora de inicio de la validación',
                example: '2024-01-17T10:30:00.000Z'
              }
            }
          },
          zapSign: {
            type: 'object',
            description: 'Información del documento creado en ZapSign',
            required: ['documentId', 'signerToken', 'signUrl'],
            properties: {
              documentId: {
                type: 'string',
                description: 'Token del documento en ZapSign',
                example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
              },
              signerToken: {
                type: 'string',
                description: 'Token del firmante en ZapSign',
                example: 'signer-token-123456'
              },
              signUrl: {
                type: 'string',
                format: 'uri',
                description: 'URL directa para firmar (mismo que documentUrl)',
                example: 'https://app.zapsign.com.br/verificacao/a1b2c3d4'
              }
            }
          }
        }
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Timestamp de la respuesta'
      }
    }
  },

  /**
   * Response de webhook procesado exitosamente
   */
  WebhookResponse: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
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
        example: 'Webhook procesado exitosamente',
        description: 'Mensaje descriptivo de la operación'
      },
      data: {
        type: 'object',
        required: ['success', 'message', 'eventType', 'validationId'],
        properties: {
          success: {
            type: 'boolean',
            example: true,
            description: 'Indica si el procesamiento del webhook fue exitoso'
          },
          message: {
            type: 'string',
            example: 'Evento doc_signed procesado. Estado: signed',
            description: 'Mensaje descriptivo del procesamiento'
          },
          eventType: {
            type: 'string',
            enum: [
              'doc_created',
              'doc_signed',
              'doc_viewed',
              'signer_viewed',
              'signer_authentication_failed',
              'doc_refused',
              'doc_expired',
              'doc_deleted'
            ],
            description: 'Tipo de evento procesado',
            example: 'doc_signed'
          },
          validationId: {
            type: 'string',
            format: 'uuid',
            description: 'ID de la validación afectada',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          previousStatus: {
            type: 'string',
            enum: ['pending', 'signed', 'failed', 'cancelled', 'expired'],
            description: 'Estado anterior de la validación (si hubo cambio)',
            example: 'pending',
            nullable: true
          },
          newStatus: {
            type: 'string',
            enum: ['pending', 'signed', 'failed', 'cancelled', 'expired'],
            description: 'Nuevo estado de la validación (si hubo cambio)',
            example: 'signed',
            nullable: true
          }
        }
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Timestamp de la respuesta'
      }
    }
  },

  // ==================== ERROR RESPONSES ESPECÍFICAS ====================

  /**
   * Error cuando ya existe una validación activa
   */
  ValidationAlreadyExistsError: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'errorCode', 'data', 'timestamp'],
    properties: {
      success: {
        type: 'boolean',
        example: false,
        description: 'Indica si la operación fue exitosa'
      },
      statusCode: {
        type: 'integer',
        example: 409,
        description: 'Código de estado HTTP (Conflict)'
      },
      message: {
        type: 'string',
        example: 'Ya tienes una validación en proceso. Completa la actual antes de solicitar una nueva.',
        description: 'Mensaje descriptivo del error'
      },
      errorCode: {
        type: 'string',
        example: 'CONFLICT',
        description: 'Código de error específico'
      },
      data: {
        type: 'object',
        description: 'Información de la validación existente',
        properties: {
          validation_id: {
            type: 'string',
            format: 'uuid',
            description: 'ID de la validación existente',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          document_url: {
            type: 'string',
            format: 'uri',
            description: 'URL del documento existente',
            example: 'https://app.zapsign.com.br/verificacao/a1b2c3d4'
          },
          status: {
            type: 'string',
            enum: ['pending', 'signed'],
            description: 'Estado de la validación existente',
            example: 'pending'
          },
          completed_at: {
            type: 'string',
            format: 'date-time',
            description: 'Fecha de completado (solo si status es signed)',
            example: '2024-01-17T10:30:00.000Z',
            nullable: true
          }
        }
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Timestamp del error'
      }
    }
  },

  /**
   * Error de validación de datos de entrada
   */
  KycValidationError: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'errorCode', 'errors', 'timestamp'],
    properties: {
      success: {
        type: 'boolean',
        example: false,
        description: 'Indica si la operación fue exitosa'
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
        type: 'array',
        description: 'Lista de errores de validación específicos del KYC',
        items: {
          type: 'object',
          required: ['field', 'message'],
          properties: {
            field: {
              type: 'string',
              enum: ['fullName', 'channel'],
              example: 'fullName',
              description: 'Campo que causó el error'
            },
            message: {
              type: 'string',
              example: 'Debes ingresar tu nombre completo (nombre y apellido como mínimo)',
              description: 'Mensaje de error específico del campo'
            }
          }
        },
        example: [
          {
            field: 'fullName',
            message: 'Debes ingresar tu nombre completo (nombre y apellido como mínimo)'
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

  /**
   * Error cuando el webhook no encuentra la validación
   */
  WebhookValidationNotFoundError: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'errorCode', 'timestamp'],
    properties: {
      success: {
        type: 'boolean',
        example: false,
        description: 'Indica si la operación fue exitosa'
      },
      statusCode: {
        type: 'integer',
        example: 404,
        description: 'Código de estado HTTP'
      },
      message: {
        type: 'string',
        example: 'Validación no encontrada para este documento',
        description: 'Mensaje descriptivo del error'
      },
      errorCode: {
        type: 'string',
        example: 'NOT_FOUND',
        description: 'Código de error específico'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Timestamp del error'
      }
    }
  }
};

module.exports = zapSignSchemas;