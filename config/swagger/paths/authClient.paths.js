/**
 * Paths de autenticación (módulo client)
 * ✨ Optimizado usando $ref a componentes comunes
 */

const authClientPaths = {
  '/client/api/auth/register': {
    post: {
      tags: ['Auth - Client'],
      summary: 'Registrar nuevo usuario',
      description: 'Registra un nuevo usuario en el sistema con sus datos personales y credenciales',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RegisterRequest'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Usuario registrado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RegisterResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
        },
        409: {
          $ref: '#/components/responses/Conflict'
        },
        422: {
          $ref: '#/components/responses/ValidationError'
        },
        429: {
          $ref: '#/components/responses/RateLimitExceeded'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  '/client/api/auth/reset-credentials/request': {
    post: {
      tags: ['Auth - Client'],
      summary: 'Solicitar reset de credenciales',
      description: 'Solicita el reset de contraseña o MFA. Se enviará un email con instrucciones si el email existe en el sistema',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RequestResetCredentialsRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Solicitud procesada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ResetCredentialsSuccessResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
        },
        422: {
          $ref: '#/components/responses/ValidationError'
        },
        429: {
          $ref: '#/components/responses/RateLimitExceeded'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  '/client/api/auth/reset-credentials/confirm': {
    post: {
      tags: ['Auth - Client'],
      summary: 'Confirmar reset de credenciales',
      description: 'Confirma el reset de contraseña o MFA usando el token recibido por email',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ConfirmResetCredentialsRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Reset confirmado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ConfirmResetCredentialsSuccessResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
        },
        404: {
          $ref: '#/components/responses/NotFound'
        },
        422: {
          $ref: '#/components/responses/ValidationError'
        },
        429: {
          $ref: '#/components/responses/RateLimitExceeded'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};

module.exports = authClientPaths;