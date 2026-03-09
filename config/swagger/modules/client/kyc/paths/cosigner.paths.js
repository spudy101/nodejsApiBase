/**
 * Paths para el módulo de Cosigner (Invitaciones y Relaciones Deudor-Codeudor)
 * Uso: Importar en tu configuración de Swagger
 */

const cosignerPaths = {
  // ==================== COSIGNER INVITATIONS ====================

  '/client/api/kyc/cosigner-invitations/generate': {
    post: {
      tags: ['Cosigner Invitations'],
      summary: 'Generar código de invitación',
      description: 'Genera un código de 6 dígitos para que un deudor pueda vincular al codeudor. Requiere usuario verificado y documentos laborales aprobados.',
      operationId: 'generateInvitationCode',
      security: [
        {
          BearerAuth: []
        }
      ],
      responses: {
        201: {
          description: 'Código de invitación generado exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
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
                    example: 'Código de invitación generado exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/InvitationCodeGenerated'
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
                statusCode: 201,
                message: 'Código de invitación generado exitosamente',
                data: {
                  cosigner_invitation_id: '123e4567-e89b-12d3-a456-426614174000',
                  invitation_code: '123456',
                  status: 'pendiente',
                  expires_at: '2025-02-03T12:00:00.000Z',
                  created_at: '2025-02-02T12:00:00.000Z'
                },
                timestamp: '2025-02-02T12:00:00.000Z'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        403: {
          description: 'Forbidden - No cumple requisitos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                noDocuments: {
                  summary: 'Sin documentos aprobados',
                  value: {
                    success: false,
                    statusCode: 403,
                    message: 'No puedes generar códigos de invitación sin tener documentos laborales aprobados',
                    errorCode: 'FORBIDDEN',
                    errors: {
                      correlationId: 'req-1737575485123-a1b2c3d4'
                    },
                    timestamp: '2025-02-02T12:00:00.000Z'
                  }
                }
              }
            }
          }
        },
        409: {
          description: 'Conflict - Ya tiene invitación pendiente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'Ya tienes un código de invitación pendiente. Espera a que expire o sea usado antes de generar uno nuevo.',
                errorCode: 'CONFLICT',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2025-02-02T12:00:00.000Z'
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

  '/client/api/kyc/cosigner-invitations/my-invitations': {
    get: {
      tags: ['Cosigner Invitations'],
      summary: 'Listar mis invitaciones generadas',
      description: 'Lista todas las invitaciones generadas por el codeudor autenticado con paginación.',
      operationId: 'listMyInvitations',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
            example: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Cantidad de elementos por página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            example: 10
          }
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Campo por el cual ordenar',
          required: false,
          schema: {
            type: 'string',
            default: 'created_at',
            example: 'created_at'
          }
        },
        {
          name: 'order',
          in: 'query',
          description: 'Dirección del ordenamiento',
          required: false,
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC',
            example: 'DESC'
          }
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filtrar por estado',
          required: false,
          schema: {
            type: 'string',
            enum: ['pendiente', 'usado', 'expirado'],
            example: 'pendiente'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Búsqueda por código de invitación',
          required: false,
          schema: {
            type: 'string',
            example: '123456'
          }
        }
      ],
      responses: {
        200: {
          description: 'Invitaciones obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'metadata', 'timestamp'],
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
                    example: 'Invitaciones obtenidas exitosamente'
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/CosignerInvitation'
                    }
                  },
                  metadata: {
                    $ref: '#/components/schemas/CompleteMetadata'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-02-02T12:00:00.000Z'
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
  },

  '/client/api/kyc/cosigner-invitations/{id}': {
    get: {
      tags: ['Cosigner Invitations'],
      summary: 'Obtener detalle de invitación',
      description: 'Obtiene el detalle completo de una invitación. Solo el propietario puede ver sus invitaciones.',
      operationId: 'getInvitationDetail',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'ID de la invitación',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      ],
      responses: {
        200: {
          description: 'Detalle de invitación obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
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
                    example: 'Detalle de invitación obtenido exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/CosignerInvitationDetail'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-02-02T12:00:00.000Z'
                  }
                }
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

  '/client/api/kyc/cosigner-invitations/use-code': {
    post: {
      tags: ['Cosigner Invitations'],
      summary: 'Usar código de invitación',
      description: 'Permite a un deudor usar un código de invitación para vincularse con un codeudor.',
      operationId: 'useInvitationCode',
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
              $ref: '#/components/schemas/UseCodeRequest'
            },
            example: {
              invitation_code: '123456'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Codeudor vinculado exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
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
                    example: 'Codeudor vinculado exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/CodeUsedResponse'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-02-02T14:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request - Código inválido o expirado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                codeUsed: {
                  summary: 'Código ya usado',
                  value: {
                    success: false,
                    statusCode: 400,
                    message: 'Este código ya fue utilizado',
                    errorCode: 'BAD_REQUEST',
                    errors: {
                      correlationId: 'req-1737575485123-a1b2c3d4'
                    },
                    timestamp: '2025-02-02T14:30:00.000Z'
                  }
                },
                codeExpired: {
                  summary: 'Código expirado',
                  value: {
                    success: false,
                    statusCode: 400,
                    message: 'Este código de invitación ha expirado',
                    errorCode: 'BAD_REQUEST',
                    errors: {
                      correlationId: 'req-1737575485123-a1b2c3d4'
                    },
                    timestamp: '2025-02-02T14:30:00.000Z'
                  }
                },
                selfCosigner: {
                  summary: 'Intentando agregarse a sí mismo',
                  value: {
                    success: false,
                    statusCode: 400,
                    message: 'No puedes agregarte a ti mismo como codeudor',
                    errorCode: 'BAD_REQUEST',
                    errors: {
                      correlationId: 'req-1737575485123-a1b2c3d4'
                    },
                    timestamp: '2025-02-02T14:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        404: {
          description: 'Not Found - Código no existe',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 404,
                message: 'Código de invitación no encontrado',
                errorCode: 'NOT_FOUND',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2025-02-02T14:30:00.000Z'
              }
            }
          }
        },
        409: {
          description: 'Conflict - Relación ya existe',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'Ya tienes una relación activa con este codeudor',
                errorCode: 'CONFLICT',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2025-02-02T14:30:00.000Z'
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

  // ==================== DEBTOR COSIGNER RELATIONSHIPS ====================

  '/client/api/kyc/debtor-cosigners/my-cosigners': {
    get: {
      tags: ['Debtor-Cosigner Relationships'],
      summary: 'Listar mis codeudores',
      description: 'Lista todos los codeudores vinculados al deudor autenticado con paginación.',
      operationId: 'listMyCosigners',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
            example: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Cantidad de elementos por página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            example: 10
          }
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Campo por el cual ordenar',
          required: false,
          schema: {
            type: 'string',
            default: 'linked_at',
            example: 'linked_at'
          }
        },
        {
          name: 'order',
          in: 'query',
          description: 'Dirección del ordenamiento',
          required: false,
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC',
            example: 'DESC'
          }
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filtrar por estado',
          required: false,
          schema: {
            type: 'string',
            enum: ['activo', 'inactivo'],
            example: 'activo'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Búsqueda por nombre o RUT del codeudor',
          required: false,
          schema: {
            type: 'string',
            example: 'Juan Pérez'
          }
        }
      ],
      responses: {
        200: {
          description: 'Codeudores obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'metadata', 'timestamp'],
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
                    example: 'Codeudores obtenidos exitosamente'
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/DebtorCosigner'
                    }
                  },
                  metadata: {
                    $ref: '#/components/schemas/CompleteMetadata'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-02-02T14:30:00.000Z'
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
  },

  '/client/api/kyc/debtor-cosigners/my-debtors': {
    get: {
      tags: ['Debtor-Cosigner Relationships'],
      summary: 'Listar mis deudores',
      description: 'Lista todos los deudores que han vinculado al codeudor autenticado con paginación.',
      operationId: 'listMyDebtors',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
            example: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Cantidad de elementos por página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            example: 10
          }
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Campo por el cual ordenar',
          required: false,
          schema: {
            type: 'string',
            default: 'linked_at',
            example: 'linked_at'
          }
        },
        {
          name: 'order',
          in: 'query',
          description: 'Dirección del ordenamiento',
          required: false,
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC',
            example: 'DESC'
          }
        },
        {
          name: 'status',
          in: 'query',
          description: 'Filtrar por estado',
          required: false,
          schema: {
            type: 'string',
            enum: ['activo', 'inactivo'],
            example: 'activo'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Búsqueda por nombre o RUT del deudor',
          required: false,
          schema: {
            type: 'string',
            example: 'María González'
          }
        }
      ],
      responses: {
        200: {
          description: 'Deudores obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'metadata', 'timestamp'],
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
                    example: 'Deudores obtenidos exitosamente'
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/DebtorCosigner'
                    }
                  },
                  metadata: {
                    $ref: '#/components/schemas/CompleteMetadata'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-02-02T14:30:00.000Z'
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
  },

  '/client/api/kyc/debtor-cosigners/{id}': {
    get: {
      tags: ['Debtor-Cosigner Relationships'],
      summary: 'Obtener detalle de relación',
      description: 'Obtiene el detalle completo de una relación deudor-codeudor. Solo el deudor o el codeudor pueden ver la relación.',
      operationId: 'getDebtorCosignerDetail',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'ID de la relación',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      ],
      responses: {
        200: {
          description: 'Detalle de relación obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
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
                    example: 'Detalle de relación obtenido exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/DebtorCosignerDetail'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-02-02T14:30:00.000Z'
                  }
                }
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

  '/client/api/kyc/debtor-cosigners/{id}/unlink': {
    patch: {
      tags: ['Debtor-Cosigner Relationships'],
      summary: 'Desvincular relación',
      description: 'Desvincula una relación deudor-codeudor. Puede ser ejecutado tanto por el deudor como por el codeudor.',
      operationId: 'unlinkDebtorCosigner',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'ID de la relación',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      ],
      responses: {
        200: {
          description: 'Relación desvinculada exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
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
                    example: 'Relación desvinculada exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/UnlinkResponse'
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                    example: '2025-02-02T16:00:00.000Z'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Bad Request - Relación ya inactiva',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 400,
                message: 'Esta relación ya está inactiva',
                errorCode: 'BAD_REQUEST',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2025-02-02T16:00:00.000Z'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        403: {
          description: 'Forbidden - No tiene permiso para desvincular',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 403,
                message: 'No tienes permiso para desvincular esta relación',
                errorCode: 'FORBIDDEN',
                errors: {
                  correlationId: 'req-1737575485123-a1b2c3d4'
                },
                timestamp: '2025-02-02T16:00:00.000Z'
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

module.exports = cosignerPaths;