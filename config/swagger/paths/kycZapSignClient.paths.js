/**
 * ========================================
 * SWAGGER PATHS - KYC ZAPSIGN MODULE
 * ========================================
 * Definiciones de endpoints para documentación Swagger
 * Módulo: Validación de identidad con ZapSign
 */

const kycZapSignPaths = {
  // ==================== POST /client/api/kyc/zapsign/generate-url ====================
  '/client/api/kyc/zapsign/generate-url': {
    post: {
      tags: ['Zapsing - Client'],
      summary: 'Generar URL de validación de identidad',
      description: `
## Descripción
Genera una URL de ZapSign para que el usuario pueda completar el proceso de validación de identidad con verificación biométrica.

## Flujo del proceso
1. El usuario autenticado solicita la URL de validación
2. Se verifica que no exista una validación activa previa
3. Se crea un documento en ZapSign con validación biométrica
4. Se guarda la validación en estado "pending" en la BD
5. Se envía un email al usuario con el link de validación
6. Se retorna la URL para que el usuario complete el proceso

## Reglas de negocio
- ✅ Solo un proceso de validación activo por usuario
- ✅ Si ya existe validación en estado "pending", se retorna error 409
- ✅ Si ya existe validación "signed", se retorna error 409
- ✅ El nombre completo debe tener al menos nombre y apellido
- ✅ El link expira después de 60 minutos (configurable)
- ✅ Se envía notificación por email con el link

## Estados posibles
- **pending**: Validación creada, esperando que el usuario complete
- **signed**: Validación completada exitosamente
- **failed**: Falló la autenticación biométrica
- **cancelled**: Proceso cancelado por el usuario
- **expired**: Link expiró sin completarse

## Notas importantes
- El usuario debe completar el proceso en ZapSign (fuera de la aplicación)
- Los resultados se reciben mediante webhook en el endpoint /webhook
- Los datos OCR del documento actualizan automáticamente el perfil del usuario
      `,
      operationId: 'generateValidationUrl',
      security: [
        {
          BearerAuth: []
        }
      ],
      requestBody: {
        required: true,
        description: 'Datos necesarios para generar la URL de validación',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/GenerateUrlRequest'
            },
            examples: {
              webChannel: {
                summary: 'Validación desde web',
                value: {
                  fullName: 'Juan Carlos Pérez González',
                  channel: 'web'
                }
              },
              mobileChannel: {
                summary: 'Validación desde móvil',
                value: {
                  fullName: 'María Fernanda López Martínez',
                  channel: 'mobile'
                }
              },
              minimalData: {
                summary: 'Solo datos requeridos (channel por defecto: web)',
                value: {
                  fullName: 'Pedro Pablo Sánchez'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'URL de validación generada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/GenerateUrlResponse'
              },
              examples: {
                success: {
                  summary: 'Respuesta exitosa',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'URL de validación generada exitosamente',
                    data: {
                      validation: {
                        id: '123e4567-e89b-12d3-a456-426614174000',
                        status: 'pending',
                        documentUrl: 'https://app.zapsign.com.br/verificacao/a1b2c3d4',
                        initiatedAt: '2024-01-17T10:30:00.000Z'
                      },
                      zapSign: {
                        documentId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                        signerToken: 'signer-token-123456',
                        signUrl: 'https://app.zapsign.com.br/verificacao/a1b2c3d4'
                      }
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        403: {
          $ref: '#/components/responses/Forbidden'
        },
        404: {
          description: 'Persona no encontrada',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 404,
                message: 'Persona no encontrada',
                errorCode: 'NOT_FOUND',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        409: {
          description: 'Ya existe una validación activa',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationAlreadyExistsError'
              },
              examples: {
                pendingValidation: {
                  summary: 'Validación pendiente existente',
                  value: {
                    success: false,
                    statusCode: 409,
                    message: 'Ya tienes una validación en proceso. Completa la actual antes de solicitar una nueva.',
                    errorCode: 'CONFLICT',
                    data: {
                      validation_id: '123e4567-e89b-12d3-a456-426614174000',
                      document_url: 'https://app.zapsign.com.br/verificacao/a1b2c3d4',
                      status: 'pending'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                alreadySigned: {
                  summary: 'Ya validado exitosamente',
                  value: {
                    success: false,
                    statusCode: 409,
                    message: 'Tu identidad ya fue validada exitosamente.',
                    errorCode: 'CONFLICT',
                    data: {
                      validation_id: '123e4567-e89b-12d3-a456-426614174000',
                      status: 'signed',
                      completed_at: '2024-01-17T09:30:00.000Z'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        422: {
          description: 'Error de validación en los datos de entrada',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/KycValidationError'
              },
              examples: {
                invalidFullName: {
                  summary: 'Nombre completo inválido',
                  value: {
                    success: false,
                    statusCode: 422,
                    message: 'Error de validación',
                    errorCode: 'VALIDATION_ERROR',
                    errors: [
                      {
                        field: 'fullName',
                        message: 'Debes ingresar tu nombre completo (nombre y apellido como mínimo)'
                      }
                    ],
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                invalidCharacters: {
                  summary: 'Caracteres inválidos en el nombre',
                  value: {
                    success: false,
                    statusCode: 422,
                    message: 'Error de validación',
                    errorCode: 'VALIDATION_ERROR',
                    errors: [
                      {
                        field: 'fullName',
                        message: 'El nombre solo puede contener letras, espacios, guiones y apóstrofes'
                      }
                    ],
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                invalidChannel: {
                  summary: 'Canal inválido',
                  value: {
                    success: false,
                    statusCode: 422,
                    message: 'Error de validación',
                    errorCode: 'VALIDATION_ERROR',
                    errors: [
                      {
                        field: 'channel',
                        message: 'El canal debe ser "web" o "mobile"'
                      }
                    ],
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        429: {
          $ref: '#/components/responses/RateLimitExceeded'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  // ==================== POST /client/api/kyc/zapsign/webhook ====================
  '/client/api/kyc/zapsign/webhook': {
    post: {
      tags: ['servicios externos'],
      summary: 'Webhook de ZapSign para eventos de validación',
      description: `
## Descripción
Endpoint público que recibe notificaciones (webhooks) desde ZapSign cuando ocurren eventos en el proceso de validación de identidad.

## Autenticación
- ⚠️ **Endpoint público** pero requiere API Key en query params
- Se debe configurar en ZapSign: \`https://tu-dominio.com/client/api/kyc/zapsign/webhook?apiKey=YOUR_API_KEY\`
- La API Key se valida mediante middleware \`externalWebhookAuthenticate\`

## Eventos soportados
| Evento | Descripción | Cambia estado |
|--------|-------------|---------------|
| \`doc_created\` | Documento creado en ZapSign | ❌ No |
| \`doc_viewed\` | Documento visualizado | ❌ No |
| \`signer_viewed\` | Firmante vio el documento | ❌ No |
| \`doc_signed\` | Documento firmado exitosamente | ✅ Sí → \`signed\` |
| \`signer_authentication_failed\` | Falló la autenticación biométrica | ✅ Sí → \`failed\` |
| \`doc_refused\` | Usuario rechazó firmar | ✅ Sí → \`cancelled\` |
| \`doc_expired\` | Documento expiró sin firmarse | ✅ Sí → \`expired\` |
| \`doc_deleted\` | Documento eliminado en ZapSign | ✅ Sí → \`cancelled\` |

## Flujo de procesamiento
1. Se recibe el webhook con el evento de ZapSign
2. Se valida el API Key desde query params
3. Se busca la validación por el token del documento
4. Se verifica si ya fue procesada (idempotencia)
5. Si cambia estado, se actualiza en BD
6. Si es \`doc_signed\`, se actualizan datos OCR de la persona
7. Se envía notificación al usuario según el resultado
8. Se retorna confirmación del procesamiento

## Actualización de datos OCR
Cuando el evento es \`doc_signed\` y contiene datos OCR:
- ✅ Se actualiza \`first_name\` de la persona
- ✅ Se actualiza \`last_name\` de la persona
- ✅ Se actualiza \`birth_date\` si está disponible
- ✅ Los nombres se capitalizan automáticamente

## Notificaciones enviadas
- **IDENTITY_VERIFIED**: Cuando status → \`signed\`
- **IDENTITY_VALIDATION_FAILED**: Cuando status → \`failed\`
- **ZAPSIGN_CONTRACT_DELETED**: Cuando status → \`cancelled\`
- **Link expirado**: Manejado por worker, no por webhook

## Idempotencia
- ✅ Si la validación ya fue procesada (status != pending), se ignora el webhook
- ✅ Retorna 200 con mensaje informativo en lugar de error
- ✅ Evita procesamiento duplicado por múltiples webhooks

## Notas importantes
- Este endpoint es llamado automáticamente por ZapSign
- No debe ser invocado manualmente excepto para testing
- Los webhooks pueden llegar múltiples veces, la idempotencia es crucial
      `,
      operationId: 'processWebhook',
      security: [],
      parameters: [
        {
          name: 'apiKey',
          in: 'query',
          required: true,
          description: 'API Key para autenticar el webhook externo. Debe coincidir con EXTERNAL_API_KEYS en .env',
          schema: {
            type: 'string',
            example: 'your-secret-api-key-123'
          }
        }
      ],
      requestBody: {
        required: true,
        description: 'Payload del webhook enviado por ZapSign',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/WebhookPayload'
            },
            examples: {
              docSigned: {
                summary: 'Documento firmado exitosamente',
                value: {
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
              authenticationFailed: {
                summary: 'Falló la autenticación biométrica',
                value: {
                  event_type: 'signer_authentication_failed',
                  token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  status: 'authentication_failed',
                  signers: [
                    {
                      token: 'signer-token-123',
                      status: 'authentication_failed'
                    }
                  ],
                  created_at: '2024-01-17T10:30:00.000Z'
                }
              },
              docRefused: {
                summary: 'Usuario rechazó firmar',
                value: {
                  event_type: 'doc_refused',
                  token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  status: 'refused',
                  created_at: '2024-01-17T10:30:00.000Z'
                }
              },
              docExpired: {
                summary: 'Documento expiró',
                value: {
                  event_type: 'doc_expired',
                  token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  status: 'expired',
                  created_at: '2024-01-17T10:30:00.000Z'
                }
              },
              docViewed: {
                summary: 'Documento visualizado (sin cambio de estado)',
                value: {
                  event_type: 'doc_viewed',
                  token: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  status: 'pending',
                  created_at: '2024-01-17T10:30:00.000Z'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Webhook procesado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/WebhookResponse'
              },
              examples: {
                successWithStatusChange: {
                  summary: 'Procesado con cambio de estado',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Webhook procesado exitosamente',
                    data: {
                      success: true,
                      message: 'Evento doc_signed procesado. Estado: signed',
                      eventType: 'doc_signed',
                      validationId: '123e4567-e89b-12d3-a456-426614174000',
                      previousStatus: 'pending',
                      newStatus: 'signed'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                successWithoutStatusChange: {
                  summary: 'Procesado sin cambio de estado',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Webhook procesado exitosamente',
                    data: {
                      success: true,
                      message: 'Evento doc_viewed procesado sin cambio de estado',
                      eventType: 'doc_viewed',
                      validationId: '123e4567-e89b-12d3-a456-426614174000'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                alreadyProcessed: {
                  summary: 'Validación ya procesada (idempotencia)',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Webhook procesado exitosamente',
                    data: {
                      success: true,
                      message: 'Validación ya procesada con estado: signed',
                      eventType: 'doc_signed',
                      validationId: '123e4567-e89b-12d3-a456-426614174000',
                      current_status: 'signed'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request - Datos del webhook inválidos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                missingEventType: {
                  summary: 'event_type faltante',
                  value: {
                    success: false,
                    statusCode: 400,
                    message: 'event_type es requerido en el webhook',
                    errorCode: 'BAD_REQUEST',
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                missingToken: {
                  summary: 'token del documento faltante',
                  value: {
                    success: false,
                    statusCode: 400,
                    message: 'token del documento es requerido en el webhook',
                    errorCode: 'BAD_REQUEST',
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                unknownEventType: {
                  summary: 'event_type no reconocido',
                  value: {
                    success: false,
                    statusCode: 400,
                    message: 'event_type no reconocido: unknown_event',
                    errorCode: 'BAD_REQUEST',
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'Unauthorized - API Key faltante',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 401,
                message: 'API Key requerida en query params',
                errorCode: 'UNAUTHORIZED',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        403: {
          description: 'Forbidden - API Key inválida',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 403,
                message: 'API Key inválida',
                errorCode: 'FORBIDDEN',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        404: {
          description: 'Validación no encontrada',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/WebhookValidationNotFoundError'
              },
              example: {
                success: false,
                statusCode: 404,
                message: 'Validación no encontrada para este documento',
                errorCode: 'NOT_FOUND',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};

module.exports = kycZapSignPaths;