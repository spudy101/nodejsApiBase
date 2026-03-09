/**
 * Paths para Correos Institucionales - Client e Instituciones
 * Endpoints: POST validar correo, GET mi correo, GET listar instituciones
 */

const institutionalClientPaths = {
  'client/api/kyc/institutional-emails': {
    post: {
      tags: ['Correos Institucionales - Client'],
      summary: 'Validar correo institucional',
      description: 'Valida el correo institucional del usuario. La validación dura 6 meses. Un correo solo puede ser validado por un usuario a la vez.',
      operationId: 'validateInstitutionalEmail',
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
              $ref: '#/components/schemas/InstitutionalEmailValidateRequest'
            },
            example: {
              email: 'juan.perez@universidad.edu',
              institution_id: '123e4567-e89b-12d3-a456-426614174000'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Correo institucional validado exitosamente',
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
                    example: 'Correo institucional validado exitosamente. Válido por 6 meses.'
                  },
                  data: {
                    $ref: '#/components/schemas/InstitutionalEmailValidatedResponse'
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
                message: 'Correo institucional validado exitosamente. Válido por 6 meses.',
                data: {
                  institutional_email_id: '123e4567-e89b-12d3-a456-426614174000',
                  email: 'juan.perez@universidad.edu',
                  validated_at: '2025-02-02T10:00:00.000Z',
                  expires_at: '2025-08-02T10:00:00.000Z',
                  is_active: true,
                  institution: {
                    institution_id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'Universidad Nacional',
                    has_agreement: true
                  },
                  message: 'Correo institucional validado exitosamente. Válido por 6 meses.'
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
                timestamp: '2025-02-02T10:00:00.000Z'
              }
            }
          }
        },
        409: {
          description: 'Conflict - Correo ya validado o usuario ya tiene correo activo',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                emailAlreadyValidated: {
                  summary: 'Correo ya validado por otro usuario',
                  value: {
                    success: false,
                    statusCode: 409,
                    message: 'Este correo institucional ya está validado por otro usuario',
                    errorCode: 'CONFLICT',
                    errors: {
                      correlationId: 'req-1737575485123-a1b2c3d4'
                    },
                    timestamp: '2025-02-02T10:00:00.000Z'
                  }
                },
                userHasActiveEmail: {
                  summary: 'Usuario ya tiene correo activo',
                  value: {
                    success: false,
                    statusCode: 409,
                    message: 'Ya tienes un correo institucional validado. Espera a que expire para validar otro.',
                    errorCode: 'CONFLICT',
                    errors: {
                      correlationId: 'req-1737575485123-a1b2c3d4'
                    },
                    timestamp: '2025-02-02T10:00:00.000Z'
                  }
                }
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
  },

  'client/api/kyc/institutional-emails/me': {
    get: {
      tags: ['Correos Institucionales - Client'],
      summary: 'Obtener mi correo institucional',
      description: 'Obtiene el correo institucional activo del usuario autenticado.',
      operationId: 'getMyInstitutionalEmail',
      security: [
        {
          BearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Correo institucional obtenido exitosamente',
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
                    example: 'Correo institucional obtenido exitosamente'
                  },
                  data: {
                    oneOf: [
                      {
                        $ref: '#/components/schemas/InstitutionalEmail'
                      },
                      {
                        type: 'null'
                      }
                    ]
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-02-02T10:00:00.000Z'
                  }
                }
              },
              examples: {
                withEmail: {
                  summary: 'Usuario tiene correo institucional',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Correo institucional obtenido exitosamente',
                    data: {
                      institutional_email_id: '123e4567-e89b-12d3-a456-426614174000',
                      email: 'juan.perez@universidad.edu',
                      validated_at: '2025-02-02T10:00:00.000Z',
                      expires_at: '2025-08-02T10:00:00.000Z',
                      is_active: true,
                      institution: {
                        institution_id: '123e4567-e89b-12d3-a456-426614174000',
                        name: 'Universidad Nacional',
                        has_agreement: true
                      },
                      created_at: '2025-02-02T10:00:00.000Z',
                      updated_at: '2025-02-02T10:00:00.000Z'
                    },
                    timestamp: '2025-02-02T10:00:00.000Z'
                  }
                },
                withoutEmail: {
                  summary: 'Usuario no tiene correo institucional',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'No tienes un correo institucional validado',
                    data: null,
                    timestamp: '2025-02-02T10:00:00.000Z'
                  }
                }
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
  }
};

module.exports = institutionalClientPaths;