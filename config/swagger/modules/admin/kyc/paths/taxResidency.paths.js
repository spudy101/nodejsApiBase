/**
 * Paths de Tax Residency (Admin)
 * Endpoints administrativos para gestionar tax residencies
 */

const taxResidencyAdminPaths = {
  '/admin/api/kyc/tax-residencies': {
    get: {
      tags: ['Tax Residency - Admin'],
      summary: 'Listar todas las tax residencies (Admin)',
      description: 'Obtiene una lista paginada de todas las tax residencies con filtros avanzados',
      operationId: 'listAllTaxResidencies',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Elementos por página',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Campo por el cual ordenar',
          schema: {
            type: 'string',
            default: 'created_at'
          }
        },
        {
          name: 'order',
          in: 'query',
          description: 'Dirección del ordenamiento',
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC'
          }
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filtrar por status',
          schema: {
            type: 'string',
            enum: ['pending', 'approved', 'rejected', 'change_requested', 'deactivation_requested', 'inactive']
          }
        },
        {
          name: 'formType',
          in: 'query',
          description: 'Filtrar por tipo de formulario',
          schema: {
            type: 'string',
            enum: ['w8', 'w9']
          }
        },
        {
          name: 'isUsTaxpayer',
          in: 'query',
          description: 'Filtrar por si paga impuestos en USA',
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'personId',
          in: 'query',
          description: 'Filtrar por ID de persona',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Búsqueda por nombre, RUT o TIN',
          schema: {
            type: 'string'
          }
        }
      ],
      responses: {
        200: {
          description: 'Lista de tax residencies obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyListResponse'
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/kyc/tax-residencies/stats': {
    get: {
      tags: ['Tax Residency - Admin'],
      summary: 'Obtener estadísticas (Admin)',
      description: 'Obtiene estadísticas generales de tax residencies',
      operationId: 'getTaxResidencyStats',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Estadísticas obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyStatsResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Estadísticas obtenidas exitosamente',
                data: {
                  total: 150,
                  by_status: {
                    pending: 10,
                    approved: 120,
                    rejected: 5,
                    change_requested: 8,
                    deactivation_requested: 3,
                    inactive: 4
                  },
                  by_form_type: {
                    w8: 30,
                    w9: 90
                  },
                  pending_review: 21,
                  change_requests: 8,
                  deactivation_requests: 3
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/admin/api/kyc/tax-residencies/{id}': {
    get: {
      tags: ['Tax Residency - Admin'],
      summary: 'Obtener detalle (Admin)',
      description: 'Obtiene el detalle completo de una tax residency',
      operationId: 'getTaxResidencyDetailAdmin',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID de la tax residency',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        200: {
          description: 'Detalle obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyDetailResponse'
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

  '/admin/api/kyc/tax-residencies/{id}/approve': {
    patch: {
      tags: ['Tax Residency - Admin'],
      summary: 'Aprobar tax residency nueva (Admin)',
      description: `
Aprueba una tax residency que está en status "pending".

**Flujo:**
1. Admin revisa la documentación/información
2. Si todo está correcto, aprueba
3. Status cambia a "approved"
4. Usuario recibe notificación
      `,
      operationId: 'approveTaxResidency',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID de la tax residency',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        200: {
          description: 'Tax residency aprobada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyActionResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Tax residency aprobada exitosamente.',
                data: {
                  tax_residency_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'approved',
                  message: 'Tax residency aprobada exitosamente.'
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

  '/admin/api/kyc/tax-residencies/{id}/reject': {
    patch: {
      tags: ['Tax Residency - Admin'],
      summary: 'Rechazar tax residency nueva (Admin)',
      description: `
Rechaza una tax residency que está en status "pending".

**Flujo:**
1. Admin revisa y encuentra problemas
2. Rechaza con razón explicativa
3. Status cambia a "rejected"
4. Usuario recibe notificación con la razón
      `,
      operationId: 'rejectTaxResidency',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID de la tax residency',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RejectRequest'
            },
            example: {
              rejection_reason: 'El documento W-9 no es legible. Por favor, sube un PDF de mejor calidad.'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Tax residency rechazada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyActionResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Tax residency rechazada. El usuario debe corregir y volver a enviar.',
                data: {
                  tax_residency_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'rejected',
                  message: 'Tax residency rechazada. El usuario debe corregir y volver a enviar.'
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

  '/admin/api/kyc/tax-residencies/{id}/approve-change': {
    patch: {
      tags: ['Tax Residency - Admin'],
      summary: 'Aprobar cambio de tax residency (Admin)',
      description: `
Aprueba un cambio de tax residency (status "change_requested").

**Flujo:**
1. Admin revisa la solicitud de cambio
2. Si aprueba, ejecuta EN UNA TRANSACCIÓN:
   - Marca la tax residency anterior como "inactive"
   - Crea la nueva tax residency con status "approved"
3. Usuario recibe notificación

**Importante:** Esto es una operación atómica. Si algo falla, se hace rollback completo.
      `,
      operationId: 'approveChange',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID de la tax residency con solicitud de cambio',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        200: {
          description: 'Cambio aprobado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyActionResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Cambio de tax residency aprobado exitosamente.',
                data: {
                  tax_residency_id: '987e6543-e21b-98d7-b654-321098765432',
                  status: 'approved',
                  message: 'Cambio de tax residency aprobado exitosamente.'
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

  '/admin/api/kyc/tax-residencies/{id}/reject-change': {
    patch: {
      tags: ['Tax Residency - Admin'],
      summary: 'Rechazar cambio de tax residency (Admin)',
      description: `
Rechaza un cambio de tax residency (status "change_requested").

**Flujo:**
1. Admin revisa y rechaza la solicitud
2. Status vuelve a "approved" (mantiene la tax residency anterior)
3. Se limpian los campos de cambio solicitado
4. Usuario recibe notificación con la razón
      `,
      operationId: 'rejectChange',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID de la tax residency',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RejectRequest'
            },
            example: {
              rejection_reason: 'El nuevo formulario W-8 no coincide con la información proporcionada.'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Cambio rechazado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyActionResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Cambio de tax residency rechazado.',
                data: {
                  tax_residency_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'approved',
                  message: 'Cambio de tax residency rechazado.'
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

  '/admin/api/kyc/tax-residencies/{id}/approve-deactivation': {
    patch: {
      tags: ['Tax Residency - Admin'],
      summary: 'Aprobar baja de tax residency (Admin)',
      description: `
Aprueba una solicitud de baja (status "deactivation_requested").

**Flujo:**
1. Admin revisa la solicitud de baja
2. Si aprueba, status cambia a "inactive"
3. Usuario recibe notificación
      `,
      operationId: 'approveDeactivation',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID de la tax residency',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        200: {
          description: 'Baja aprobada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyActionResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Baja de tax residency aprobada exitosamente.',
                data: {
                  tax_residency_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'inactive',
                  message: 'Baja de tax residency aprobada exitosamente.'
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

  '/admin/api/kyc/tax-residencies/{id}/reject-deactivation': {
    patch: {
      tags: ['Tax Residency - Admin'],
      summary: 'Rechazar baja de tax residency (Admin)',
      description: `
Rechaza una solicitud de baja (status "deactivation_requested").

**Flujo:**
1. Admin revisa y rechaza la solicitud
2. Status vuelve a "approved"
3. Se limpian los campos de baja solicitada
4. Usuario recibe notificación con la razón
      `,
      operationId: 'rejectDeactivation',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID de la tax residency',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RejectRequest'
            },
            example: {
              rejection_reason: 'No puedes dar de baja tu tax residency mientras tengas cuentas activas.'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Baja rechazada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyActionResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Baja de tax residency rechazada.',
                data: {
                  tax_residency_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'approved',
                  message: 'Baja de tax residency rechazada.'
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

module.exports = taxResidencyAdminPaths;