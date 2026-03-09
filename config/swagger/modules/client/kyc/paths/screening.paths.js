/**
 * Paths de Screening - Client (Usuario final)
 * Endpoints para que los usuarios gestionen sus screenings
 */

const screeningClientPaths = {
  '/client/api/kyc/screenings': {
    post: {
      tags: ['Screening - Client'],
      summary: 'Crear screening inicial',
      description: `
        Inicia el proceso de screening respondiendo las preguntas iniciales (PEP, sanciones, medios adversos).
        
        **Flujo:**
        1. Usuario responde las 3 preguntas
        2. Se crea un screening con status 'pending'
        3. El worker lo procesa asíncronamente llamando a Zapsign
        4. El webhook actualiza el screening cuando Zapsign termine
        
        **Validaciones:**
        - No puede tener otro screening pendiente
        - Las 3 respuestas son obligatorias
      `,
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateInitialScreeningRequest'
            },
            examples: {
              allFalse: {
                summary: 'Usuario sin alertas',
                value: {
                  is_pep: false,
                  has_sanctions: false,
                  has_adverse_media: false
                }
              },
              withPep: {
                summary: 'Usuario es PEP',
                value: {
                  is_pep: true,
                  has_sanctions: false,
                  has_adverse_media: false
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Screening creado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateScreeningResponse'
              },
              example: {
                success: true,
                statusCode: 201,
                message: 'Screening iniciado exitosamente. Procesaremos tu información en breve.',
                data: {
                  screening_id: '123e4567-e89b-12d3-a456-426614174000',
                  type: 'initial_questions',
                  status: 'pending',
                  created_at: '2024-01-17T10:30:00.000Z',
                  message: 'Screening iniciado. Procesaremos tu información en breve.'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
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
        409: {
          description: 'Conflict - Ya existe un screening pendiente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'Ya tienes un screening pendiente de procesamiento',
                errorCode: 'CONFLICT',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        422: {
          $ref: '#/components/responses/ValidationError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },
    get: {
      tags: ['Screening - Client'],
      summary: 'Listar mis screenings',
      description: `
        Obtiene el listado paginado de los screenings del usuario autenticado.
        
        **Características:**
        - Paginación configurable
        - Filtros por tipo, status, admin_action
        - Búsqueda por nombre/apellido/documento
        - Ordenamiento flexible
      `,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Número de página'
        },
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Elementos por página'
        },
        {
          name: 'sortBy',
          in: 'query',
          schema: {
            type: 'string',
            default: 'created_at'
          },
          description: 'Campo para ordenar'
        },
        {
          name: 'order',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC'
          },
          description: 'Dirección de ordenamiento'
        },
        {
          name: 'type',
          in: 'query',
          schema: {
            $ref: '#/components/schemas/ScreeningType'
          },
          description: 'Filtrar por tipo de screening'
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            $ref: '#/components/schemas/ScreeningStatus'
          },
          description: 'Filtrar por estado'
        },
        {
          name: 'adminAction',
          in: 'query',
          schema: {
            $ref: '#/components/schemas/AdminAction'
          },
          description: 'Filtrar por acción del admin'
        },
        {
          name: 'pepFlag',
          in: 'query',
          schema: {
            type: 'boolean'
          },
          description: 'Filtrar por PEP flag'
        }
      ],
      responses: {
        200: {
          description: 'Lista de screenings obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListScreeningsResponse'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  '/client/api/kyc/screenings/{id}': {
    get: {
      tags: ['Screening - Client'],
      summary: 'Obtener detalle de screening',
      description: `
        Obtiene el detalle completo de un screening específico.
        
        **Incluye:**
        - Información básica del screening
        - Respuestas iniciales (initial_answers)
        - Detalles de PEP, Sanctions, Adverse Media
        - Información del revisor (si fue revisado)
        
        **Validaciones:**
        - El screening debe pertenecer al usuario autenticado
      `,
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: {
            $ref: '#/components/schemas/UUID'
          },
          description: 'UUID del screening'
        }
      ],
      responses: {
        200: {
          description: 'Detalle del screening obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ScreeningDetailResponse'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        403: {
          description: 'Forbidden - No tienes permiso para ver este screening',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 403,
                message: 'No tienes permiso para ver este screening',
                errorCode: 'FORBIDDEN',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        404: {
          $ref: '#/components/responses/NotFound'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};

module.exports = screeningClientPaths;