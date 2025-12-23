/**
 * Paths de autenticación
 */

const authPaths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Registrar nuevo usuario',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UserCreate'
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
                $ref: '#/components/schemas/AuthResponse'
              }
            }
          }
        },
        400: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse'
              }
            }
          }
        },
        429: {
          description: 'Demasiadas peticiones'
        }
      }
    }
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Iniciar sesión',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/LoginRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Login exitoso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AuthResponse'
              }
            }
          }
        },
        401: {
          description: 'Credenciales inválidas',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        429: {
          description: 'Demasiadas peticiones'
        }
      }
    }
  },
  '/auth/profile': {
    get: {
      tags: ['Auth'],
      summary: 'Obtener perfil del usuario autenticado',
      security: [
        {
          bearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Perfil obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string'
                  },
                  data: {
                    $ref: '#/components/schemas/User'
                  }
                }
              }
            }
          }
        },
        401: {
          description: 'No autorizado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  }
};

module.exports = authPaths;