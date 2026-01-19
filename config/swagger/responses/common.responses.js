/**
 * Respuestas comunes reutilizables para todos los endpoints
 * Uso: En tus paths usa { $ref: '#/components/responses/BadRequest' }
 */

const commonResponses = {
  // ==================== SUCCESS RESPONSES ====================

  Success: {
    description: 'Operación exitosa',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/SuccessResponse'
        }
      }
    }
  },

  Created: {
    description: 'Recurso creado exitosamente',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/SuccessResponse'
        }
      }
    }
  },

  PaginatedSuccess: {
    description: 'Lista paginada obtenida exitosamente',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/PaginatedResponse'
        },
        example: {
          success: true,
          statusCode: 200,
          message: 'Datos obtenidos exitosamente',
          data: [],
          metadata: {
            pagination: {
              currentPage: 1,
              pageSize: 10,
              totalItems: 100,
              totalPages: 10,
              hasNextPage: true,
              hasPreviousPage: false
            }
          },
          timestamp: '2024-01-17T10:30:00.000Z'
        }
      }
    }
  },

  // ==================== ERROR RESPONSES ====================

  BadRequest: {
    description: 'Bad Request - Solicitud incorrecta o datos inválidos',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ErrorResponse'
        },
        examples: {
          badRequest: {
            summary: 'Error genérico de solicitud',
            value: {
              success: false,
              statusCode: 400,
              message: 'Error en la solicitud',
              errorCode: 'BAD_REQUEST',
              timestamp: '2024-01-17T10:30:00.000Z'
            }
          }
        }
      }
    }
  },

  Unauthorized: {
    description: 'Unauthorized - No autenticado o token inválido',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ErrorResponse'
        },
        examples: {
          unauthorized: {
            summary: 'No autorizado',
            value: {
              success: false,
              statusCode: 401,
              message: 'No autorizado',
              errorCode: 'UNAUTHORIZED',
              timestamp: '2024-01-17T10:30:00.000Z'
            }
          },
          invalidToken: {
            summary: 'Token inválido o expirado',
            value: {
              success: false,
              statusCode: 401,
              message: 'Token inválido o expirado',
              errorCode: 'UNAUTHORIZED',
              timestamp: '2024-01-17T10:30:00.000Z'
            }
          }
        }
      }
    }
  },

  Forbidden: {
    description: 'Forbidden - No tiene permisos para acceder a este recurso',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ErrorResponse'
        },
        examples: {
          forbidden: {
            summary: 'Acceso denegado',
            value: {
              success: false,
              statusCode: 403,
              message: 'Acceso denegado',
              errorCode: 'FORBIDDEN',
              timestamp: '2024-01-17T10:30:00.000Z'
            }
          }
        }
      }
    }
  },

  NotFound: {
    description: 'Not Found - Recurso no encontrado',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ErrorResponse'
        },
        examples: {
          notFound: {
            summary: 'Recurso no encontrado',
            value: {
              success: false,
              statusCode: 404,
              message: 'Recurso no encontrado',
              errorCode: 'NOT_FOUND',
              timestamp: '2024-01-17T10:30:00.000Z'
            }
          }
        }
      }
    }
  },

  Conflict: {
    description: 'Conflict - Conflicto con el estado actual del recurso',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ErrorResponse'
        },
        examples: {
          conflict: {
            summary: 'Conflicto de recursos',
            value: {
              success: false,
              statusCode: 409,
              message: 'El recurso ya existe',
              errorCode: 'CONFLICT',
              timestamp: '2024-01-17T10:30:00.000Z'
            }
          }
        }
      }
    }
  },

  ValidationError: {
    description: 'Unprocessable Entity - Error de validación',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ValidationErrorResponse'
        },
        examples: {
          validationError: {
            summary: 'Errores de validación',
            value: {
              success: false,
              statusCode: 422,
              message: 'Error de validación',
              errorCode: 'VALIDATION_ERROR',
              errors: [
                {
                  field: 'email',
                  message: 'El email es requerido'
                },
                {
                  field: 'password',
                  message: 'La contraseña debe tener al menos 8 caracteres'
                }
              ],
              timestamp: '2024-01-17T10:30:00.000Z'
            }
          }
        }
      }
    }
  },

  RateLimitExceeded: {
    description: 'Too Many Requests - Límite de solicitudes excedido',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ErrorResponse'
        },
        examples: {
          rateLimited: {
            summary: 'Demasiadas peticiones',
            value: {
              success: false,
              statusCode: 429,
              message: 'Demasiadas peticiones',
              errorCode: 'RATE_LIMIT',
              timestamp: '2024-01-17T10:30:00.000Z'
            }
          }
        }
      }
    }
  },

  InternalServerError: {
    description: 'Internal Server Error - Error interno del servidor',
    content: {
      'application/json': {
        schema: {
          $ref: '#/components/schemas/ErrorResponse'
        },
        examples: {
          serverError: {
            summary: 'Error interno del servidor',
            value: {
              success: false,
              statusCode: 500,
              message: 'Error interno del servidor',
              errorCode: 'INTERNAL_ERROR',
              timestamp: '2024-01-17T10:30:00.000Z'
            }
          }
        }
      }
    }
  }
};

module.exports = commonResponses;