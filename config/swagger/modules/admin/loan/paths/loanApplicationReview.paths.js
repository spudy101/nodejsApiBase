/**
 * Paths ADMIN para Loan Application Reviews
 * Solo incluye rutas accesibles por administradores
 */

const loanApplicationReviewAdminPaths = {
  // ==================== ADMIN PATHS ====================

  '/admin/api/loan/applications/reviews': {
    get: {
      tags: ['Loan Application Review - Admin'],
      summary: 'Listar todas las solicitudes de revisión (Admin)',
      description: 'Obtiene la lista paginada de todas las solicitudes de revisión con filtros',
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
          description: 'Búsqueda por texto (nombre de aplicante, producto, etc.)'
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
        403: { $ref: '#/components/responses/Forbidden' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/loan/applications/reviews/{review_id}': {
    get: {
      tags: ['Loan Application Review - Admin'],
      summary: 'Obtener detalle de solicitud (Admin)',
      description: 'Obtiene el detalle completo de una solicitud de revisión para revisión administrativa',
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

  '/admin/api/loan/applications/reviews/{review_id}/approve': {
    post: {
      tags: ['Loan Application Review - Admin'],
      summary: 'Aprobar solicitud sin cambios (Admin)',
      description: 'El administrador aprueba la solicitud sin modificaciones, creando inmediatamente una oferta para el cliente',
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
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AdminApproveRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Solicitud aprobada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/AdminActionResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Solicitud aprobada exitosamente. Se ha creado una oferta para el cliente.',
                data: {
                  review_id: '123e4567-e89b-12d3-a456-426614174000',
                  offer_id: '123e4567-e89b-12d3-a456-426614174002',
                  status: 'approved',
                  message: 'Solicitud aprobada exitosamente. Se ha creado una oferta para el cliente.'
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

  '/admin/api/loan/applications/reviews/{review_id}/approve-with-changes': {
    post: {
      tags: ['Loan Application Review - Admin'],
      summary: 'Aprobar con modificaciones (Admin)',
      description: 'El administrador aprueba la solicitud con modificaciones. Requiere aprobación de un segundo administrador antes de crear la oferta.',
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
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AdminApproveWithChangesRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Solicitud aprobada con cambios - requiere segundo admin',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/AdminActionResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Solicitud aprobada con modificaciones. Requiere aprobación de otro administrador.',
                data: {
                  review_id: '123e4567-e89b-12d3-a456-426614174000',
                  change_request_id: '123e4567-e89b-12d3-a456-426614174003',
                  status: 'pending_second_approval',
                  message: 'Solicitud aprobada con modificaciones. Requiere aprobación de otro administrador.'
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
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/loan/applications/reviews/{review_id}/reject': {
    post: {
      tags: ['Loan Application Review - Admin'],
      summary: 'Rechazar solicitud (Admin)',
      description: 'El administrador rechaza la solicitud con razones específicas',
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
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AdminRejectRequest'
            }
          }
        }
      },
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
                        $ref: '#/components/schemas/AdminActionResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Solicitud rechazada exitosamente.',
                data: {
                  review_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'rejected',
                  message: 'Solicitud rechazada exitosamente.'
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
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/loan/applications/changes/{change_request_id}/approve': {
    post: {
      tags: ['Loan Application Review - Admin'],
      summary: 'Segundo admin aprueba cambios',
      description: 'Un segundo administrador aprueba los cambios propuestos, creando la oferta con las modificaciones',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'change_request_id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID de la solicitud de cambios'
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SecondAdminApproveRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Cambios aprobados exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/SecondAdminActionResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Cambios aprobados exitosamente. Se ha creado una oferta con las modificaciones.',
                data: {
                  review_id: '123e4567-e89b-12d3-a456-426614174000',
                  offer_id: '123e4567-e89b-12d3-a456-426614174002',
                  status: 'approved',
                  message: 'Cambios aprobados exitosamente. Se ha creado una oferta con las modificaciones.'
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

  '/admin/api/loan/applications/changes/{change_request_id}/reject': {
    post: {
      tags: ['Loan Application Review - Admin'],
      summary: 'Segundo admin rechaza cambios',
      description: 'Un segundo administrador rechaza los cambios propuestos, devolviendo la solicitud a estado pending_admin',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'change_request_id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID de la solicitud de cambios'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/SecondAdminRejectRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Cambios rechazados exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/SecondAdminActionResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Cambios rechazados. La solicitud vuelve a estar pendiente de revisión.',
                data: {
                  review_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'pending_admin',
                  message: 'Cambios rechazados. La solicitud vuelve a estar pendiente de revisión.'
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
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  }
};

module.exports = loanApplicationReviewAdminPaths;