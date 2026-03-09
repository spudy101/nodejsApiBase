/**
 * Paths de Employment Records para ADMINISTRADORES (Admin)
 * Define todos los endpoints disponibles para administradores
 */

const employmentRecordsAdminPaths = {
  '/admin/api/kyc/employment-records/stats': {
    get: {
      tags: ['Documentos laborales - Admin'],
      summary: 'Obtener estadísticas de registros laborales',
      description: `
Obtiene estadísticas generales de todos los registros laborales del sistema.

**Incluye:**
- Total de registros
- Cantidad de registros por estado
- Cantidad de registros por tipo de empleo
- Registros pendientes de revisión
      `,
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Estadísticas obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EmploymentRecordStatsResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Estadísticas obtenidas exitosamente',
                data: {
                  total: 150,
                  by_status: {
                    pendiente: 10,
                    aprobado: 120,
                    rechazado: 15,
                    requiere_renovacion: 3,
                    pendiente_renovacion: 1,
                    expirado: 0,
                    dado_de_baja: 1
                  },
                  by_employment_type: {
                    dependiente: 100,
                    independiente: 50
                  },
                  pending_review: 11
                },
                timestamp: '2024-01-30T10:00:00.000Z'
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/kyc/employment-records': {
    get: {
      tags: ['Documentos laborales - Admin'],
      summary: 'Listar TODOS los registros laborales',
      description: 'Obtiene una lista paginada de todos los registros laborales del sistema con filtros avanzados',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Número de página'
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          description: 'Cantidad de elementos por página'
        },
        {
          name: 'sortBy',
          in: 'query',
          schema: { type: 'string', default: 'created_at' },
          description: 'Campo por el cual ordenar'
        },
        {
          name: 'order',
          in: 'query',
          schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
          description: 'Dirección del ordenamiento'
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Término de búsqueda (busca en company_name)'
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: [
              'pendiente',
              'aprobado',
              'rechazado',
              'requiere_renovacion',
              'pendiente_renovacion',
              'expirado',
              'dado_de_baja'
            ]
          },
          description: 'Filtrar por estado'
        },
        {
          name: 'employmentType',
          in: 'query',
          schema: { type: 'string', enum: ['dependiente', 'independiente'] },
          description: 'Filtrar por tipo de empleo'
        },
        {
          name: 'personId',
          in: 'query',
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'Filtrar por ID de persona específica'
        }
      ],
      responses: {
        200: {
          description: 'Lista de registros laborales obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EmploymentRecordListResponse'
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/kyc/employment-records/{id}': {
    get: {
      tags: ['Documentos laborales - Admin'],
      summary: 'Obtener detalle completo de un registro',
      description: `
Obtiene el detalle completo de un registro laboral, incluyendo:
- Información del usuario
- Documentos adjuntos
- Historial de revisiones
- Admin que realizó la última revisión
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID del registro laboral'
        }
      ],
      responses: {
        200: {
          description: 'Detalle del registro laboral obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EmploymentRecordDetailResponse'
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/kyc/employment-records/{id}/approve': {
    patch: {
      tags: ['Documentos laborales - Admin'],
      summary: 'Aprobar un registro laboral',
      description: `
Aprueba un registro laboral que está en estado \`pendiente\` o \`pendiente_renovacion\`.

**Acciones automáticas al aprobar:**
1. Se cambia el estado a \`aprobado\`
2. Se registra la fecha de aprobación (\`approved_at\`)
3. Se registra el admin que aprobó (\`reviewed_by_person_id\`)
4. Se crea un review en el historial
5. Se envía notificación al usuario (\`DOCUMENTOS_LABORALES_ACEPTADOS\`)
6. **Se verifica automáticamente la completitud del perfil del usuario**
7. Si el perfil está al 100%, se upgradea a \`USER_VERIFIED\`
8. Se envía notificación de perfil completado si aplica (\`PROFILE_COMPLETED\`)

**Estados válidos para aprobar:**
- \`pendiente\` → Primera aprobación
- \`pendiente_renovacion\` → Renovación de dependiente
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID del registro laboral'
        }
      ],
      responses: {
        200: {
          description: 'Registro laboral aprobado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EmploymentRecordActionResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Registro laboral aprobado exitosamente',
                data: {
                  employment_record_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'aprobado'
                },
                timestamp: '2024-01-30T10:00:00.000Z'
              }
            }
          }
        },
        400: {
          description: 'Bad Request - El registro no puede ser aprobado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 400,
                message: 'Este registro no puede ser aprobado en su estado actual',
                errorCode: 'BAD_REQUEST',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2024-01-30T10:00:00.000Z'
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/kyc/employment-records/{id}/reject': {
    patch: {
      tags: ['Documentos laborales - Admin'],
      summary: 'Rechazar un registro laboral',
      description: `
Rechaza un registro laboral que está en estado \`pendiente\` o \`pendiente_renovacion\`.

**Acciones automáticas al rechazar:**
1. Se cambia el estado a \`rechazado\` (registro muerto permanentemente)
2. Se guarda la razón del rechazo (\`rejection_reason\`)
3. Se registra el admin que rechazó (\`reviewed_by_person_id\`)
4. Se crea un review en el historial
5. Se envía notificación al usuario (\`DOCUMENTOS_LABORALES_RECHAZADOS\`) con el motivo

**Importante:**
- El registro queda inactivo permanentemente
- El usuario debe crear un nuevo registro desde cero
- La razón del rechazo debe ser clara para que el usuario sepa qué corregir

**Estados válidos para rechazar:**
- \`pendiente\` → Primera revisión
- \`pendiente_renovacion\` → Renovación de dependiente
      `,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID del registro laboral'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RejectEmploymentRecordRequest'
            },
            examples: {
              liquidacionesIncompletas: {
                summary: 'Liquidaciones incompletas',
                value: {
                  rejection_reason: 'Las liquidaciones de sueldo están incompletas. Solo se adjuntaron 2 de las 3 requeridas.'
                }
              },
              documentosIlegibles: {
                summary: 'Documentos ilegibles',
                value: {
                  rejection_reason: 'Los documentos adjuntos son ilegibles o están cortados. Por favor, sube imágenes más claras.'
                }
              },
              contratoVencido: {
                summary: 'Contrato vencido',
                value: {
                  rejection_reason: 'El contrato de trabajo adjunto está vencido. Fecha de término: 2023-12-31. Por favor, sube un contrato vigente.'
                }
              },
              nombreNoCoincide: {
                summary: 'Nombre no coincide',
                value: {
                  rejection_reason: 'El nombre en los documentos no coincide con el nombre registrado en tu perfil.'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Registro laboral rechazado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EmploymentRecordActionResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Registro laboral rechazado',
                data: {
                  employment_record_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'rechazado',
                  rejection_reason: 'Las liquidaciones están incompletas'
                },
                timestamp: '2024-01-30T10:00:00.000Z'
              }
            }
          }
        },
        400: {
          description: 'Bad Request - El registro no puede ser rechazado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 400,
                message: 'Este registro no puede ser rechazado en su estado actual',
                errorCode: 'BAD_REQUEST',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2024-01-30T10:00:00.000Z'
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  }
};

module.exports = employmentRecordsAdminPaths;