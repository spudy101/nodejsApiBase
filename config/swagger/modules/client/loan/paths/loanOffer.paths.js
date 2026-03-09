/**
 * Paths para Loan Offers
 * Solo incluye rutas CLIENT (no hay rutas ADMIN para offers)
 */

const loanOfferPaths = {
  // ==================== CLIENT PATHS ====================

  '/client/api/loan/offers': {
    get: {
      tags: ['Loan Offer - Client'],
      summary: 'Listar mis ofertas de préstamo',
      description: 'Obtiene la lista paginada de ofertas de préstamo del usuario autenticado (como aplicante o codeudor)',
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
            enum: ['pending_applicant', 'pending_cosigner', 'accepted', 'rejected', 'expired']
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
                          $ref: '#/components/schemas/LoanOfferList'
                        }
                      },
                      metadata: {
                        $ref: '#/components/schemas/CompleteMetadata'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Ofertas obtenidas exitosamente',
                data: [
                  {
                    offer_id: '123e4567-e89b-12d3-a456-426614174000',
                    cosigner_person_id: '123e4567-e89b-12d3-a456-426614174000',
                    aplicant_person_id: '123e4567-e89b-12d3-a456-426614174000',
                    status: 'pending_applicant',
                    approved_amount: 4500000,
                    term_months: 12,
                    expires_at: '2024-01-24T10:30:00.000Z',
                    created_at: '2024-01-17T10:30:00.000Z',
                    product_name: 'Préstamo de Consumo',
                    product_code: 'CONSUMER_LOAN_V1',
                    is_expired: false,
                    has_cosigner: true,
                    monthly_installment: 456789.50
                  }
                ],
                metadata: {
                  $ref: '#/components/schemas/CompleteMetadata'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
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

  '/client/api/loan/offers/{offer_id}': {
    get: {
      tags: ['Loan Offer - Client'],
      summary: 'Obtener detalle de mi oferta',
      description: 'Obtiene el detalle completo de una oferta de préstamo (solo si pertenece al usuario como aplicante o codeudor)',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'offer_id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID de la oferta'
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
                        $ref: '#/components/schemas/LoanOfferDetail'
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

  '/client/api/loan/offers/{offer_id}/accept': {
    post: {
      tags: ['Loan Offer - Client'],
      summary: 'Aplicante acepta la oferta',
      description: 'El aplicante acepta la oferta de préstamo. Si tiene codeudor, pasa a estado pending_cosigner; si no, queda aceptada completamente.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'offer_id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID de la oferta'
        }
      ],
      responses: {
        200: {
          description: 'Oferta aceptada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/AcceptOfferResponse'
                      }
                    }
                  }
                ]
              },
              examples: {
                withoutCosigner: {
                  summary: 'Sin codeudor - oferta completamente aceptada',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: '¡Felicitaciones! La oferta ha sido aceptada por todas las partes.',
                    data: {
                      offer_id: '123e4567-e89b-12d3-a456-426614174000',
                      status: 'accepted',
                      message: '¡Felicitaciones! La oferta ha sido aceptada por todas las partes.',
                      accepted_at: '2024-01-17T12:00:00.000Z',
                      next_step: 'loan_disbursement'
                    },
                    timestamp: '2024-01-17T12:00:00.000Z'
                  }
                },
                withCosigner: {
                  summary: 'Con codeudor - esperando aceptación del codeudor',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Has aceptado la oferta. Ahora debe aceptar el codeudor.',
                    data: {
                      offer_id: '123e4567-e89b-12d3-a456-426614174000',
                      status: 'pending_cosigner',
                      message: 'Has aceptado la oferta. Ahora debe aceptar el codeudor.',
                      accepted_at: '2024-01-17T12:00:00.000Z',
                      next_step: 'waiting_cosigner_acceptance'
                    },
                    timestamp: '2024-01-17T12:00:00.000Z'
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
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/client/api/loan/offers/{offer_id}/cosigner/accept': {
    post: {
      tags: ['Loan Offer - Client'],
      summary: 'Codeudor acepta la oferta',
      description: 'El codeudor acepta la oferta de préstamo, completando la aceptación de todas las partes',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'offer_id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID de la oferta'
        }
      ],
      responses: {
        200: {
          description: 'Oferta aceptada exitosamente por el codeudor',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/AcceptOfferResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: '¡Felicitaciones! La oferta ha sido aceptada por todas las partes.',
                data: {
                  offer_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'accepted',
                  message: '¡Felicitaciones! La oferta ha sido aceptada por todas las partes.',
                  accepted_at: '2024-01-17T12:30:00.000Z',
                  next_step: 'loan_disbursement'
                },
                timestamp: '2024-01-17T12:30:00.000Z'
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

  '/client/api/loan/offers/{offer_id}/reject': {
    post: {
      tags: ['Loan Offer - Client'],
      summary: 'Aplicante rechaza la oferta',
      description: 'El aplicante rechaza la oferta de préstamo',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'offer_id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID de la oferta'
        }
      ],
      responses: {
        200: {
          description: 'Oferta rechazada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/RejectOfferResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Has rechazado la oferta.',
                data: {
                  offer_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'rejected',
                  message: 'Has rechazado la oferta.'
                },
                timestamp: '2024-01-17T12:00:00.000Z'
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

  '/client/api/loan/offers/{offer_id}/cosigner/reject': {
    post: {
      tags: ['Loan Offer - Client'],
      summary: 'Codeudor rechaza la oferta',
      description: 'El Codeudor rechaza la oferta de préstamo',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'offer_id',
          in: 'path',
          required: true,
          schema: { $ref: '#/components/schemas/UUID' },
          description: 'ID de la oferta'
        }
      ],
      responses: {
        200: {
          description: 'Oferta rechazada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/RejectOfferResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Has rechazado la oferta.',
                data: {
                  offer_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'rejected',
                  message: 'Has rechazado la oferta.'
                },
                timestamp: '2024-01-17T12:00:00.000Z'
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

module.exports = loanOfferPaths;