/**
 * Paths para Admin - Gestión de Instituciones
 * Endpoints: POST, PATCH
 */

const institutionalAdminPaths = {
  '/admin/api/core/institutions': {
    post: {
      tags: ['Instituciones - Admin'],
      summary: 'Crear institución',
      description: 'Crea una nueva institución educativa. Si tiene convenio, debe incluir datos de transferencia y correo para informes.',
      operationId: 'createInstitution',
      security: [
        {
          BearerAuth: []
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/InstitutionCreateRequest'
            },
            examples: {
              withAgreement: {
                summary: 'Institución CON convenio',
                value: {
                  name: 'Universidad Nacional',
                  has_agreement: true,
                  transfer_data: {
                    bank: 'Banco Estado',
                    account_number: '123456789',
                    account_type: 'Cuenta Corriente',
                    rut: '12.345.678-9'
                  },
                  report_email: 'informes@universidad.edu'
                }
              },
              withoutAgreement: {
                summary: 'Institución SIN convenio',
                value: {
                  name: 'Instituto Técnico',
                  has_agreement: false
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Institución creada exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  statusCode: {
                    type: 'integer',
                    example: 201
                  },
                  message: {
                    type: 'string',
                    example: 'Institución creada exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/InstitutionCreatedResponse'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-02-02T10:00:00.000Z'
                  }
                }
              },
              example: {
                success: true,
                statusCode: 201,
                message: 'Institución creada exitosamente',
                data: {
                  institution_id: '123e4567-e89b-12d3-a456-426614174000',
                  name: 'Universidad Nacional',
                  has_agreement: true,
                  created_at: '2025-02-02T10:00:00.000Z',
                  message: 'Institución creada exitosamente'
                },
                timestamp: '2025-02-02T10:00:00.000Z'
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
        409: {
          description: 'Conflict - Ya existe una institución con este nombre',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'Ya existe una institución con este nombre',
                errorCode: 'CONFLICT',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2025-02-02T10:00:00.000Z'
              }
            }
          }
        },
        422: {
          description: 'Validation Error - Error de validación de lógica de negocio',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse'
              },
              examples: {
                missingTransferData: {
                  summary: 'Falta transfer_data cuando has_agreement es true',
                  value: {
                    success: false,
                    statusCode: 422,
                    message: 'transfer_data es requerido cuando has_agreement es true',
                    errorCode: 'VALIDATION_ERROR',
                    errors: [
                      {
                        field: 'transfer_data',
                        message: 'Debes proporcionar datos de transferencia si tiene convenio'
                      }
                    ],
                    timestamp: '2025-02-02T10:00:00.000Z'
                  }
                },
                missingReportEmail: {
                  summary: 'Falta report_email cuando has_agreement es true',
                  value: {
                    success: false,
                    statusCode: 422,
                    message: 'report_email es requerido cuando has_agreement es true',
                    errorCode: 'VALIDATION_ERROR',
                    errors: [
                      {
                        field: 'report_email',
                        message: 'Debes proporcionar un correo para informes si tiene convenio'
                      }
                    ],
                    timestamp: '2025-02-02T10:00:00.000Z'
                  }
                }
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

  '/admin/api/core/institutions/{id}': {
    patch: {
      tags: ['Instituciones - Admin'],
      summary: 'Actualizar institución',
      description: 'Actualiza una institución existente. Si tiene convenio, debe incluir datos de transferencia y correo para informes.',
      operationId: 'updateInstitution',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID de la institución',
          schema: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/InstitutionUpdateRequest'
            },
            examples: {
              changeToWithAgreement: {
                summary: 'Cambiar a CON convenio',
                value: {
                  has_agreement: true,
                  transfer_data: {
                    bank: 'Banco Estado',
                    account_number: '987654321'
                  },
                  report_email: 'reportes@universidad.edu'
                }
              },
              changeToWithoutAgreement: {
                summary: 'Cambiar a SIN convenio',
                value: {
                  has_agreement: false
                }
              },
              updateName: {
                summary: 'Actualizar solo nombre',
                value: {
                  name: 'Universidad Nacional de Chile'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Institución actualizada exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  statusCode: {
                    type: 'integer',
                    example: 200
                  },
                  message: {
                    type: 'string',
                    example: 'Institución actualizada exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/InstitutionUpdatedResponse'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-02-02T12:00:00.000Z'
                  }
                }
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Institución actualizada exitosamente',
                data: {
                  institution_id: '123e4567-e89b-12d3-a456-426614174000',
                  name: 'Universidad Nacional',
                  has_agreement: true,
                  transfer_data: {
                    bank: 'Banco Estado',
                    account_number: '987654321'
                  },
                  report_email: 'reportes@universidad.edu',
                  updated_at: '2025-02-02T12:00:00.000Z',
                  message: 'Institución actualizada exitosamente'
                },
                timestamp: '2025-02-02T12:00:00.000Z'
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
          description: 'Not Found - Institución no encontrada',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 404,
                message: 'Institución no encontrada',
                errorCode: 'NOT_FOUND',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2025-02-02T12:00:00.000Z'
              }
            }
          }
        },
        409: {
          description: 'Conflict - Ya existe otra institución con este nombre',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'Ya existe una institución con este nombre',
                errorCode: 'CONFLICT',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2025-02-02T12:00:00.000Z'
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
    }
  }
};

module.exports = institutionalAdminPaths;