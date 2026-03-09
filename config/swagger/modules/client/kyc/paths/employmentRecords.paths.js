/**
 * Paths de Employment Records para USUARIOS (Client)
 * Define todos los endpoints disponibles para usuarios normales
 */

const employmentRecordsClientPaths = {
  '/client/api/kyc/employment-records': {
    post: {
      tags: ['Documentos laborales - Client'],
      summary: 'Crear un nuevo registro laboral con documentos',
      description: `
Crea un nuevo registro laboral para el usuario autenticado.

**Casos de uso:**
1. **Usuario que trabaja (dependiente):** Debe subir 1 contrato + 3 liquidaciones
2. **Usuario que trabaja (independiente):** Debe subir 4 boletas
3. **Usuario que NO trabaja:** No debe subir archivos, solo declarar is_employed = false

**Validaciones:**
- Si \`is_employed = true\`, se requieren \`company_name\`, \`monthly_salary\` y archivos
- Si \`is_employed = false\`, NO se deben enviar \`company_name\`, \`monthly_salary\` ni archivos
- Los archivos deben ser PDFs válidos de máximo 10MB cada uno
- No se puede crear un nuevo registro si ya hay uno con estado \`pendiente\`
      `,
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              required: ['employment_type', 'is_employed'],
              properties: {
                employment_type: {
                  type: 'string',
                  enum: ['dependiente', 'independiente'],
                  description: 'Tipo de empleo'
                },
                is_employed: {
                  type: 'boolean',
                  description: 'true si trabaja, false si no trabaja'
                },
                company_name: {
                  type: 'string',
                  description: 'Nombre de la empresa (requerido si is_employed = true)',
                  minLength: 2,
                  maxLength: 200
                },
                monthly_salary: {
                  type: 'number',
                  description: 'Salario mensual (requerido si is_employed = true)',
                  minimum: 0
                },
                contrato: {
                  type: 'string',
                  format: 'binary',
                  description: 'Contrato de trabajo (1 archivo, solo para dependientes)'
                },
                liquidaciones: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'binary'
                  },
                  description: 'Liquidaciones de sueldo (3 archivos, solo para dependientes)',
                  maxItems: 3
                },
                boletas: {
                  type: 'array',
                  items: {
                    type: 'string',
                    format: 'binary'
                  },
                  description: 'Boletas de honorarios (4 archivos, solo para independientes)',
                  maxItems: 4
                }
              }
            },
            examples: {
              dependiente: {
                summary: 'Usuario dependiente que trabaja',
                value: {
                  employment_type: 'dependiente',
                  is_employed: true,
                  company_name: 'Empresa ABC S.A.',
                  monthly_salary: 1500000
                  // + contrato (1 PDF)
                  // + liquidaciones (3 PDFs)
                }
              },
              independiente: {
                summary: 'Usuario independiente que trabaja',
                value: {
                  employment_type: 'independiente',
                  is_employed: true,
                  company_name: 'Freelance',
                  monthly_salary: 1200000
                  // + boletas (4 PDFs)
                }
              },
              noTrabaja: {
                summary: 'Usuario que NO trabaja',
                value: {
                  employment_type: 'dependiente',
                  is_employed: false
                  // NO enviar company_name, monthly_salary ni archivos
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Registro laboral creado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EmploymentRecordCreatedResponse'
              },
              example: {
                success: true,
                statusCode: 201,
                message: 'Registro laboral creado exitosamente',
                data: {
                  employment_record_id: '123e4567-e89b-12d3-a456-426614174000',
                  employment_type: 'dependiente',
                  company_name: 'Empresa ABC S.A.',
                  is_employed: true,
                  monthly_salary: 1500000,
                  status: 'pendiente',
                  created_at: '2024-01-30T10:00:00.000Z',
                  documents: [
                    {
                      employment_document_id: '123e4567-e89b-12d3-a456-426614174001',
                      document_type: 'contrato',
                      file_url: 'https://bucket.s3.amazonaws.com/employment-documents/contratos/uuid.pdf',
                      file_name: 'contrato.pdf',
                      file_size: 524288,
                      uploaded_at: '2024-01-30T10:00:00.000Z'
                    }
                  ]
                },
                timestamp: '2024-01-30T10:00:00.000Z'
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        409: {
          description: 'Conflicto - Ya existe un registro pendiente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'Ya tienes un registro laboral pendiente de revisión',
                errorCode: 'CONFLICT',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2024-01-30T10:00:00.000Z'
              }
            }
          }
        },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    },
    get: {
      tags: ['Documentos laborales - Client'],
      summary: 'Listar mis registros laborales',
      description: 'Obtiene una lista paginada de todos los registros laborales del usuario autenticado',
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
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/client/api/kyc/employment-records/{id}': {
    get: {
      tags: ['Documentos laborales - Client'],
      summary: 'Obtener detalle de un registro laboral',
      description: 'Obtiene el detalle completo de un registro laboral específico. Solo puede ver sus propios registros.',
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
        403: {
          description: 'Prohibido - No tiene permiso para ver este registro',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 403,
                message: 'No tienes permiso para ver este registro',
                errorCode: 'FORBIDDEN',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2024-01-30T10:00:00.000Z'
              }
            }
          }
        },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/client/api/kyc/employment-records/{id}/cancel': {
    patch: {
      tags: ['Documentos laborales - Client'],
      summary: 'Dar de baja un registro laboral',
      description: `
Da de baja un registro laboral activo. Solo se pueden dar de baja registros con los siguientes estados:
- \`aprobado\`
- \`requiere_renovacion\`
- \`pendiente_renovacion\`

Una vez dado de baja, el registro queda inactivo permanentemente y el usuario debe crear uno nuevo.

**Casos de uso:**
- Cambió de trabajo
- Le subieron el sueldo
- Cambió su situación laboral
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
          description: 'Registro laboral dado de baja exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          employment_record_id: {
                            $ref: '#/components/schemas/UUID'
                          }
                        }
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Registro laboral dado de baja exitosamente',
                data: {
                  employment_record_id: '123e4567-e89b-12d3-a456-426614174000'
                },
                timestamp: '2024-01-30T10:00:00.000Z'
              }
            }
          }
        },
        400: {
          description: 'Bad Request - El registro no puede ser dado de baja',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 400,
                message: 'Solo puedes dar de baja registros aprobados o en renovación',
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

  '/client/api/kyc/employment-records/{id}/confirm-renewal': {
    patch: {
      tags: ['Documentos laborales - Client'],
      summary: 'Confirmar renovación (solo dependientes)',
      description: `
Confirma la renovación de documentos laborales para usuarios dependientes.

**Solo aplicable a registros con estado \`requiere_renovacion\`**

**Opciones:**
1. \`use_same_documents = true\`: El usuario confirma que sigue trabajando en el mismo lugar. El admin solo validará que el contrato siga vigente.
2. \`use_same_documents = false\`: El usuario indica que debe subir nuevos documentos (cambió de trabajo o necesita actualizar).

**Nota:** Los usuarios independientes NO pueden usar este endpoint, siempre deben crear un nuevo registro con nuevas boletas.
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
              $ref: '#/components/schemas/ConfirmRenewalRequest'
            },
            examples: {
              mismoTrabajo: {
                summary: 'Sigue en el mismo trabajo',
                value: {
                  use_same_documents: true
                }
              },
              nuevoDocumentos: {
                summary: 'Necesita subir nuevos documentos',
                value: {
                  use_same_documents: false
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Renovación confirmada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/EmploymentRecordActionResponse'
              },
              examples: {
                confirmado: {
                  summary: 'Confirmó usar mismos documentos',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Renovación confirmada. Tu registro está en revisión.',
                    data: {
                      employment_record_id: '123e4567-e89b-12d3-a456-426614174000',
                      status: 'pendiente_renovacion'
                    },
                    timestamp: '2024-01-30T10:00:00.000Z'
                  }
                },
                nuevosDocs: {
                  summary: 'Indicó que necesita nuevos documentos',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Debes subir nuevos documentos para renovar.',
                    data: {
                      employment_record_id: '123e4567-e89b-12d3-a456-426614174000',
                      status: 'requiere_renovacion'
                    },
                    timestamp: '2024-01-30T10:00:00.000Z'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request - No se puede renovar este registro',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                noRequiereRenovacion: {
                  summary: 'Registro no requiere renovación',
                  value: {
                    success: false,
                    statusCode: 400,
                    message: 'Este registro no requiere renovación',
                    errorCode: 'BAD_REQUEST',
                    errors: {
                      correlationId: 'req-1737575485123-a1b2c3d4'
                    },
                    timestamp: '2024-01-30T10:00:00.000Z'
                  }
                },
                independiente: {
                  summary: 'Usuario independiente no puede renovar',
                  value: {
                    success: false,
                    statusCode: 400,
                    message: 'Solo los dependientes pueden renovar con los mismos documentos',
                    errorCode: 'BAD_REQUEST',
                    errors: {
                      correlationId: 'req-1737575485123-a1b2c3d4'
                    },
                    timestamp: '2024-01-30T10:00:00.000Z'
                  }
                }
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

module.exports = employmentRecordsClientPaths;