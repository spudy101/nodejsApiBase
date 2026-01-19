/**
 * Schemas relacionados con autenticación (módulo client)
 */

const authSchemas = {
  // ==================== REQUEST SCHEMAS ====================
  
  RegisterRequest: {
    type: 'object',
    required: ['email', 'password', 'firstName', 'lastName', 'nationalId', 'genderId', 'countryId'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'usuario@example.com',
        description: 'Email del usuario'
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'Password123',
        description: 'Contraseña (mínimo 8 caracteres, debe contener mayúscula, minúscula y número)'
      },
      firstName: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        example: 'Juan',
        description: 'Nombre de la persona'
      },
      lastName: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        example: 'Pérez',
        description: 'Apellido de la persona'
      },
      nationalId: {
        type: 'string',
        minLength: 6,
        maxLength: 20,
        example: '12345678-9',
        description: 'Número de documento de identidad (RUT, DNI, etc.)'
      },
      genderId: {
        type: 'string',
        format: 'uuid',
        example: 'a05b1555-592f-4d66-9013-6f5ab48a8233',
        description: 'ID del género'
      },
      countryId: {
        type: 'string',
        format: 'uuid',
        example: '9fa50c24-c239-4d7a-830c-e4672904db90',
        description: 'ID del país'
      }
    }
  },

  RequestResetCredentialsRequest: {
    type: 'object',
    required: ['email', 'type'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'usuario@example.com',
        description: 'Email del usuario'
      },
      type: {
        type: 'string',
        enum: ['password', 'mfa'],
        example: 'password',
        description: 'Tipo de reset solicitado'
      }
    }
  },

  ConfirmResetCredentialsRequest: {
    type: 'object',
    required: ['token', 'type'],
    properties: {
      token: {
        type: 'string',
        minLength: 64,
        maxLength: 64,
        example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2',
        description: 'Token de reset recibido por email'
      },
      type: {
        type: 'string',
        enum: ['password', 'mfa'],
        example: 'password',
        description: 'Tipo de reset'
      },
      newPassword: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'NewPassword123',
        description: 'Nueva contraseña (requerido solo si type=password)'
      }
    }
  },

  // ==================== RESPONSE SCHEMAS ====================

  RegisterResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      statusCode: {
        type: 'number',
        example: 201
      },
      message: {
        type: 'string',
        example: 'Usuario registrado exitosamente'
      },
      data: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000'
              },
              username: {
                type: 'string',
                example: '12345678-9'
              },
              isActive: {
                type: 'boolean',
                example: true
              },
              roleId: {
                type: 'string',
                format: 'uuid',
                example: '55ccdff0-af63-4c35-835a-b18215537b8a'
              },
              createdAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-17T10:30:00.000Z'
              }
            }
          },
          person: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174001'
              },
              firstName: {
                type: 'string',
                example: 'Juan'
              },
              lastName: {
                type: 'string',
                example: 'Pérez'
              },
              nationalId: {
                type: 'string',
                example: '12345678-9'
              },
              genderId: {
                type: 'string',
                format: 'uuid',
                example: 'a05b1555-592f-4d66-9013-6f5ab48a8233'
              },
              countryId: {
                type: 'string',
                format: 'uuid',
                example: '9fa50c24-c239-4d7a-830c-e4672904db90'
              }
            }
          },
          contact: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174002'
              },
              email: {
                type: 'string',
                format: 'email',
                example: 'usuario@example.com'
              },
              emailVerifiedAt: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-17T10:30:00.000Z'
              }
            }
          },
          tokens: {
            type: 'object',
            properties: {
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              idToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              refreshToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              expiresIn: {
                type: 'number',
                example: 3600,
                description: 'Tiempo de expiración en segundos'
              }
            }
          }
        }
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  ResetCredentialsSuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      statusCode: {
        type: 'number',
        example: 200
      },
      message: {
        type: 'string',
        example: 'Si el email existe en nuestro sistema, recibirás un correo con instrucciones'
      },
      data: {
        type: 'null',
        example: null
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  ConfirmResetCredentialsSuccessResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      statusCode: {
        type: 'number',
        example: 200
      },
      message: {
        type: 'string',
        example: 'Contraseña actualizada exitosamente'
      },
      data: {
        type: 'null',
        example: null
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  // ==================== ERROR SCHEMAS ====================

  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      statusCode: {
        type: 'number',
        example: 400
      },
      message: {
        type: 'string',
        example: 'Error en la solicitud'
      },
      errorCode: {
        type: 'string',
        example: 'BAD_REQUEST',
        nullable: true
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  ValidationErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      statusCode: {
        type: 'number',
        example: 422
      },
      message: {
        type: 'string',
        example: 'Error de validación'
      },
      errorCode: {
        type: 'string',
        example: 'VALIDATION_ERROR'
      },
      errors: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              example: 'email'
            },
            message: {
              type: 'string',
              example: 'El email es requerido'
            }
          }
        }
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  }
};

module.exports = authSchemas;