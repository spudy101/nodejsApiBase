/**
 * Paths de Screening - Admin
 * Endpoints para que los administradores gestionen y revisen screenings
 */

const screeningAdminPaths = {
  'admin/api/kyc/screenings': {
    get: {
      tags: ['Screening - Admin'],
      summary: 'Listar todos los screenings (Admin)',
      description: `
        Obtiene el listado paginado de TODOS los screenings del sistema.
        
        **Solo para administradores.**
        
        **Características:**
        - Paginación configurable
        - Filtros avanzados (tipo, status, admin_action, pep_flag, person_id)
        - Búsqueda por nombre/apellido/documento del usuario
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
          name: 'search',
          in: 'query',
          schema: {
            type: 'string'
          },
          description: 'Búsqueda por nombre, apellido o documento'
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
        },
        {
          name: 'personId',
          in: 'query',
          schema: {
            $ref: '#/components/schemas/UUID'
          },
          description: 'Filtrar por ID de persona específica'
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
        403: {
          $ref: '#/components/responses/Forbidden'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  'admin/api/kyc/screenings/{id}': {
    get: {
      tags: ['Screening - Admin'],
      summary: 'Obtener detalle de screening (Admin)',
      description: `
        Obtiene el detalle completo de cualquier screening del sistema.
        
        **Solo para administradores.**
        
        **Incluye:**
        - Información completa del screening
        - Respuestas iniciales del usuario
        - Detalles de PEP, Sanctions, Adverse Media
        - Información del usuario (person)
        - Información del revisor (si fue revisado)
        - Notas del admin
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
          $ref: '#/components/responses/Forbidden'
        },
        404: {
          $ref: '#/components/responses/NotFound'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  'admin/api/kyc/screenings/{id}/review': {
    patch: {
      tags: ['Screening - Admin'],
      summary: 'Revisar y tomar acción sobre screening',
      description: `
        Permite al admin tomar una acción sobre un screening completado.
        
        **Solo para administradores.**
        
        **Acciones disponibles:**
        - \`mark_dangerous\`: Marcar como peligroso (bloquea acceso)
        - \`false_positive\`: Marcar como falso positivo (usuario puede continuar)
        - \`approve_with_pep_flag\`: Aprobar con flag PEP (usuario continúa con restricciones)
        - \`retry\`: Reintentar screening (vuelve a 'pending')
        - \`dismiss\`: Descartar screening
        
        **Validaciones:**
        - Solo se pueden revisar screenings con status 'completed'
        - Para acción 'retry', no debe haber otro screening pendiente
        - Para acción 'approve_with_pep_flag', pep_flag es obligatorio
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
          description: 'UUID del screening a revisar'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AdminReviewRequest'
            },
            examples: {
              falsePositive: {
                summary: 'Marcar como falso positivo',
                value: {
                  admin_action: 'false_positive',
                  admin_notes: 'Revisado manualmente. Las alertas son falsos positivos.'
                }
              },
              approveWithPep: {
                summary: 'Aprobar con PEP flag',
                value: {
                  admin_action: 'approve_with_pep_flag',
                  pep_flag: true,
                  admin_notes: 'Usuario es PEP pero puede continuar con monitoreo.'
                }
              },
              markDangerous: {
                summary: 'Marcar como peligroso',
                value: {
                  admin_action: 'mark_dangerous',
                  admin_notes: 'Usuario tiene sanciones internacionales activas. Bloqueado.'
                }
              },
              retry: {
                summary: 'Reintentar screening',
                value: {
                  admin_action: 'retry',
                  admin_notes: 'Error en el proceso anterior. Reintentando.'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Screening revisado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AdminReviewResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Screening revisado exitosamente',
                data: {
                  screening_id: '123e4567-e89b-12d3-a456-426614174000',
                  admin_action: 'approve_with_pep_flag',
                  pep_flag: true,
                  reviewed_at: '2024-01-17T10:30:00.000Z',
                  message: 'Aprobado con PEP flag. Usuario puede continuar con restricciones.'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: {
          description: 'Bad Request - Solo se pueden revisar screenings completados',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 400,
                message: 'Solo puedes revisar screenings completados',
                errorCode: 'BAD_REQUEST',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        403: {
          $ref: '#/components/responses/Forbidden'
        },
        404: {
          $ref: '#/components/responses/NotFound'
        },
        409: {
          description: 'Conflict - Ya existe un screening pendiente (para retry)',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'No puedes reintentar porque ya existe un screening pendiente para este usuario. Espera a que el worker lo procese primero.',
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
          description: 'Validation Error - pep_flag requerido para approve_with_pep_flag',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse'
              },
              example: {
                success: false,
                statusCode: 422,
                message: 'pep_flag es requerido cuando admin_action es approve_with_pep_flag',
                errorCode: 'VALIDATION_ERROR',
                errors: [
                  {
                    field: 'pep_flag',
                    message: 'pep_flag es requerido para esta acción'
                  }
                ],
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
  },

  'admin/api/kyc/screenings/stats': {
    get: {
      tags: ['Screening - Admin'],
      summary: 'Obtener estadísticas de screenings',
      description: `
        Obtiene estadísticas generales del sistema de screenings.
        
        **Solo para administradores.**
        
        **Incluye:**
        - Total de screenings
        - Conteo por estado (pending, completed, failed)
        - Conteo por tipo (initial_questions, monthly_review)
        - Screenings pendientes de revisión
        - Screenings con alertas
        - Screenings con PEP flag
      `,
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Estadísticas obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ScreeningStatsResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Estadísticas de screenings obtenidas exitosamente',
                data: {
                  total: 150,
                  by_status: {
                    pending: 10,
                    completed: 130,
                    failed: 10
                  },
                  by_type: {
                    initial_questions: 100,
                    monthly_review: 50
                  },
                  pending_review: 5,
                  with_alerts: 8,
                  with_pep_flag: 3
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        403: {
          $ref: '#/components/responses/Forbidden'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};

module.exports = screeningAdminPaths;