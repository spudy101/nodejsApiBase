/**
 * Paths CLIENT para Loan Application Reviews
 * Solo incluye rutas accesibles por clientes (aplicantes y codeudores)
 */

const loanApplicationReviewClientPaths = {
  // ==================== CLIENT PATHS ====================

  '/client/api/loan/applications/reviews': {
    post: {
      tags: ['Loan Application Review - Client'],
      summary: 'Crear review desde un attempt',
      description: 'El cliente envía un intento de préstamo aprobado para revisión administrativa. Si tiene codeudor, primero debe aceptar el codeudor.',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateReviewRequest'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Review creada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/CreateReviewResponse'
                      }
                    }
                  }
                ]
              },
              examples: {
                withoutCosigner: {
                  summary: 'Sin codeudor - va directo a admin',
                  value: {
                    success: true,
                    statusCode: 201,
                    message: 'Solicitud de revisión creada exitosamente',
                    data: {
                      review_id: '123e4567-e89b-12d3-a456-426614174000',
                      attempt_id: '123e4567-e89b-12d3-a456-426614174001',
                      status: 'pending_admin',
                      requires_cosigner_acceptance: false,
                      created_at: '2024-01-17T10:30:00.000Z',
                      message: 'Solicitud enviada al equipo de revisión.'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                withCosigner: {
                  summary: 'Con codeudor - esperando aceptación',
                  value: {
                    success: true,
                    statusCode: 201,
                    message: 'Solicitud de revisión creada exitosamente',
                    data: {
                      review_id: '123e4567-e89b-12d3-a456-426614174000',
                      attempt_id: '123e4567-e89b-12d3-a456-426614174001',
                      status: 'pending_cosigner',
                      requires_cosigner_acceptance: true,
                      created_at: '2024-01-17T10:30:00.000Z',
                      message: 'Solicitud creada. Esperando aceptación del codeudor.'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    },

    get: {
      tags: ['Loan Application Review - Client'],
      summary: 'Listar mis solicitudes de revisión',
      description: 'Obtiene la lista paginada de solicitudes de revisión del usuario autenticado',
      security: [{ BearerAuth: [] }],
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
          description: 'Elementos por página'
        },
        {
          name: 'sortBy',
          in: 'query',
          schema: { type: 'string', default: 'created_at' },
          description: 'Campo para ordenar'
        },
        {
          name: 'order',
          in: 'query',
          schema: { type: 'string', enum: ['ASC', 'DESC'], default: 'DESC' },
          description: 'Dirección del ordenamiento'
        },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['pending_cosigner', 'pending_admin', 'approved', 'rejected']
          },
          description: 'Filtrar por estado'
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Búsqueda por texto'
        }
      ],
      responses: {
        200: {
          description: 'Lista obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/LoanApplicationReviewList'
                        }
                      },
                      metadata: {
                        $ref: '#/components/schemas/CompleteMetadata'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/client/api/loan/applications/reviews/{review_id}': {
    get: {
      tags: ['Loan Application Review - Client'],
      summary: 'Obtener detalle de mi solicitud de revisión',
      description: 'Obtiene el detalle completo de una solicitud de revisión (solo si pertenece al usuario como aplicante o codeudor)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'review_id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID de la solicitud de revisión'
        }
      ],
      responses: {
        200: {
          description: 'Detalle obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/LoanApplicationReviewDetail'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/client/api/loan/applications/reviews/{review_id}/cosigner/accept': {
    post: {
      tags: ['Loan Application Review - Client'],
      summary: 'Codeudor acepta la solicitud',
      description: 'El codeudor acepta la solicitud de revisión, permitiendo que pase a revisión administrativa',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'review_id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID de la solicitud de revisión'
        }
      ],
      responses: {
        200: {
          description: 'Solicitud aceptada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/CosignerActionResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Has aceptado la solicitud. Ahora será revisada por el equipo administrativo.',
                data: {
                  review_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'pending_admin',
                  message: 'Has aceptado la solicitud. Ahora será revisada por el equipo administrativo.'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/client/api/loan/applications/reviews/{review_id}/cosigner/reject': {
    post: {
      tags: ['Loan Application Review - Client'],
      summary: 'Codeudor rechaza la solicitud',
      description: 'El codeudor rechaza la solicitud de revisión, marcándola como rechazada',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'review_id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID de la solicitud de revisión'
        }
      ],
      responses: {
        200: {
          description: 'Solicitud rechazada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/CosignerActionResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Has rechazado la solicitud.',
                data: {
                  review_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'rejected',
                  message: 'Has rechazado la solicitud.'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  }
};

module.exports = loanApplicationReviewClientPaths;