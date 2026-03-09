/**
 * Paths de Tax Residency (Usuario)
 * Endpoints públicos para que usuarios gestionen sus tax residencies
 */

const taxResidencyPaths = {
  '/client/api/kyc/tax-residencies': {
    post: {
      tags: ['Tax Residency - Client'],
      summary: 'Crear tax residency',
      description: `
Crea una nueva tax residency para el usuario autenticado.

**Flujos posibles:**

1. **Usuario paga impuestos en USA:**
   - Si es individuo (US Person = true) → Requiere formulario W-9
   - Si es entidad (US Person = false) → Requiere formulario W-8
   - Status: pending (requiere aprobación del banco)

2. **Usuario NO paga impuestos en USA:**
   - Si tiene misma residencia fiscal que el banco → Auto-aprobado sin documento
   - Si tiene otras residencias fiscales (CRS) → Requiere declaración bajo juramento + lista de países con TINs (Status: pending)

**Reglas de validación:**
- Solo puede tener UNA tax residency activa o pendiente
- Los campos requeridos dependen del flujo (USA vs CRS)
- El archivo PDF solo es requerido si paga impuestos en USA
      `,
      operationId: 'createTaxResidency',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              $ref: '#/components/schemas/CreateTaxResidencyRequest'
            },
            examples: {
              usTaxpayerIndividual: {
                summary: 'USA Taxpayer - Individuo (W-9)',
                description: 'Usuario que paga impuestos en USA como individuo. Requiere formulario W-9.',
                value: {
                  is_us_taxpayer: true,
                  is_us_person: true,
                  us_tin: '123-45-6789',
                  tax_form: '(archivo PDF del formulario W-9)'
                }
              },
              usTaxpayerEntity: {
                summary: 'USA Taxpayer - Entidad (W-8)',
                description: 'Usuario que paga impuestos en USA como entidad. Requiere formulario W-8.',
                value: {
                  is_us_taxpayer: true,
                  is_us_person: false,
                  us_tin: '12-3456789',
                  tax_form: '(archivo PDF del formulario W-8)'
                }
              },
              nonUsSameResidency: {
                summary: 'NO USA - Misma residencia que banco',
                description: 'Usuario que NO paga impuestos en USA y tiene la misma residencia fiscal que el banco. Auto-aprobado.',
                value: {
                  is_us_taxpayer: false,
                  has_same_tax_residency_as_bank: true
                }
              },
              nonUsCrs: {
                summary: 'NO USA - CRS (múltiples países)',
                description: 'Usuario que NO paga impuestos en USA y tiene otras residencias fiscales. Requiere declaración.',
                value: {
                  is_us_taxpayer: false,
                  has_same_tax_residency_as_bank: false,
                  declaration_accepted: true,
                  tax_countries: [
                    {
                      country_id: '123e4567-e89b-12d3-a456-426614174001',
                      tin: '12-3456789-0'
                    },
                    {
                      country_id: '123e4567-e89b-12d3-a456-426614174002',
                      tin: '98-7654321-1'
                    }
                  ]
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Tax residency creada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyCreatedResponse'
              },
              examples: {
                usTaxpayerCreated: {
                  summary: 'USA Taxpayer creado',
                  value: {
                    success: true,
                    statusCode: 201,
                    message: 'Tax residency creada exitosamente',
                    data: {
                      tax_residency_id: '123e4567-e89b-12d3-a456-426614174000',
                      is_us_taxpayer: true,
                      form_type: 'w9',
                      document_url: 'https://s3.amazonaws.com/bucket/tax-forms/form.pdf',
                      status: 'pending',
                      created_at: '2024-01-17T10:30:00.000Z'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                nonUsAutoApproved: {
                  summary: 'NO USA - Auto-aprobado',
                  value: {
                    success: true,
                    statusCode: 201,
                    message: 'Tax residency creada exitosamente',
                    data: {
                      tax_residency_id: '123e4567-e89b-12d3-a456-426614174000',
                      is_us_taxpayer: false,
                      form_type: null,
                      document_url: null,
                      status: 'approved',
                      created_at: '2024-01-17T10:30:00.000Z'
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
        409: {
          description: 'Conflict - Ya tiene una tax residency activa o pendiente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'Ya tienes una tax residency activa o pendiente. Si deseas cambiarla, solicita un cambio desde tu tax residency actual.',
                errorCode: 'CONFLICT',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    },

    get: {
      tags: ['Tax Residency - Client'],
      summary: 'Listar mis tax residencies',
      description: 'Obtiene una lista paginada de las tax residencies del usuario autenticado',
      operationId: 'listMyTaxResidencies',
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
          name: 'search',
          in: 'query',
          description: 'Búsqueda por TIN',
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
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/client/api/kyc/tax-residencies/{id}': {
    get: {
      tags: ['Tax Residency - Client'],
      summary: 'Obtener detalle de tax residency',
      description: 'Obtiene el detalle completo de una tax residency específica del usuario',
      operationId: 'getTaxResidencyDetail',
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

  '/client/api/kyc/tax-residencies/{id}/request-change': {
    post: {
      tags: ['Tax Residency - Client'],
      summary: 'Solicitar cambio de tax residency',
      description: `
Solicita cambiar la tax residency actual. El usuario envía los datos de la NUEVA situación fiscal y el admin la revisa.

**Flujo:**
1. Usuario envía solicitud con nueva data
2. Status cambia a "change_requested"
3. Admin puede:
   - Aprobar: Marca la anterior como "inactive" y crea la nueva como "approved" (en UNA transacción)
   - Rechazar: Vuelve a "approved"

**Requisitos:**
- Solo se puede solicitar cambio si el status es "approved"
- Si la nueva situación requiere formulario USA, debe adjuntar el archivo
      `,
      operationId: 'requestChange',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID de la tax residency actual',
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              $ref: '#/components/schemas/RequestChangeRequest'
            },
            examples: {
              changeToUsaTaxpayer: {
                summary: 'Cambio a USA Taxpayer',
                description: 'Usuario que NO pagaba impuestos en USA ahora sí paga',
                value: {
                  change_reason: 'Me mudé a Estados Unidos y ahora tengo obligaciones fiscales allí',
                  new_tax_residency_data: {
                    is_us_taxpayer: true,
                    is_us_person: true,
                    us_tin: '987-65-4321'
                  },
                  new_tax_form: '(archivo PDF del nuevo formulario W-9)'
                }
              },
              changeToNonUs: {
                summary: 'Cambio a NO USA',
                description: 'Usuario que pagaba impuestos en USA ya no paga',
                value: {
                  change_reason: 'Dejé de ser residente fiscal de USA',
                  new_tax_residency_data: {
                    is_us_taxpayer: false,
                    has_same_tax_residency_as_bank: true
                  }
                }
              },
              changeCrsCountries: {
                summary: 'Cambio de países CRS',
                description: 'Cambio en las residencias fiscales CRS',
                value: {
                  change_reason: 'Me mudé a otro país y cambió mi residencia fiscal',
                  new_tax_residency_data: {
                    is_us_taxpayer: false,
                    has_same_tax_residency_as_bank: false,
                    declaration_accepted: true,
                    tax_countries: [
                      {
                        country_id: '123e4567-e89b-12d3-a456-426614174003',
                        tin: '11-2233445-5'
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Solicitud de cambio enviada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyActionResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Solicitud de cambio enviada exitosamente. El banco la revisará pronto.',
                data: {
                  tax_residency_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'change_requested',
                  message: 'Solicitud de cambio enviada exitosamente. El banco la revisará pronto.'
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

  '/client/api/kyc/tax-residencies/{id}/request-deactivation': {
    post: {
      tags: ['Tax Residency - Client'],
      summary: 'Solicitar baja de tax residency',
      description: `
Solicita dar de baja la tax residency actual.

**Flujo:**
1. Usuario envía solicitud con razón
2. Status cambia a "deactivation_requested"
3. Admin puede:
   - Aprobar: Marca como "inactive"
   - Rechazar: Vuelve a "approved"

**Requisitos:**
- Solo se puede solicitar baja si el status es "approved"
      `,
      operationId: 'requestDeactivation',
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
              $ref: '#/components/schemas/RequestDeactivationRequest'
            },
            example: {
              deactivation_reason: 'Ya no necesito esta declaración fiscal porque cerré mi cuenta'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Solicitud de baja enviada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TaxResidencyActionResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Solicitud de baja enviada exitosamente. El banco la revisará pronto.',
                data: {
                  tax_residency_id: '123e4567-e89b-12d3-a456-426614174000',
                  status: 'deactivation_requested',
                  message: 'Solicitud de baja enviada exitosamente. El banco la revisará pronto.'
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

module.exports = taxResidencyPaths;