/**
 * Paths para el módulo de autenticación (Shared)
 * Disponible en: /admin/api/auth y /client/api/auth
 */

const authPaths = {
  '/<admin>o<client>/api/auth/login': {
    post: {
      tags: ['Auth - Shared'],
      summary: 'Login de usuario',
      description: 'Autentica un usuario con su número de documento y contraseña. Si el usuario tiene MFA habilitado, retorna un desafío MFA.',
      operationId: 'loginUser',
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
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/LoginResponse'
                      }
                    }
                  }
                ]
              },
              examples: {
                loginSuccess: {
                  summary: 'Login exitoso sin MFA',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Login exitoso',
                    data: {
                      user: {
                        userId: '123e4567-e89b-12d3-a456-426614174000',
                        username: 'usuario@example.com',
                        isActive: true,
                        mfaEnabled: false,
                        person: {
                          personId: '123e4567-e89b-12d3-a456-426614174001',
                          firstName: 'Juan',
                          lastName: 'Pérez',
                          nationalId: '12345678',
                          birthDate: '1990-01-01',
                          genderId: '123e4567-e89b-12d3-a456-426614174002',
                          countryId: '123e4567-e89b-12d3-a456-426614174003'
                        },
                        role: {
                          roleId: '123e4567-e89b-12d3-a456-426614174004',
                          name: 'CLIENT',
                          description: 'Usuario cliente'
                        }
                      },
                      tokens: {
                        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        idToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                        expiresIn: 3600
                      }
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                mfaRequired: {
                  summary: 'MFA requerido',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Login exitoso',
                    data: {
                      requiresMFA: true,
                      challengeType: 'SOFTWARE_TOKEN_MFA',
                      session: 'AYABeG...'
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
        403: { $ref: '#/components/responses/Forbidden' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/auth/verify-mfa': {
    post: {
      tags: ['Auth - Shared'],
      summary: 'Verificar código MFA',
      description: 'Verifica el código TOTP y completa el proceso de autenticación.',
      operationId: 'verifyMFA',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/VerifyMFARequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Verificación MFA exitosa',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/LoginResponse'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/auth/refresh': {
    post: {
      tags: ['Auth - Shared'],
      summary: 'Refrescar token de acceso',
      description: 'Obtiene un nuevo token de acceso usando el refresh token.',
      operationId: 'refreshToken',
      parameters: [
        {
          name: 'x-refresh-token',
          in: 'header',
          required: true,
          schema: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
          },
          description: 'Refresh token proporcionado en el login'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RefreshTokenRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Token renovado exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/RefreshTokenResponse'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        422: { $ref: '#/components/responses/ValidationError' },
        429: { $ref: '#/components/responses/RateLimitExceeded' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/auth/logout': {
    post: {
      tags: ['Auth - Shared'],
      summary: 'Cerrar sesión del dispositivo actual',
      description: 'Cierra la sesión del usuario en el dispositivo actual.',
      operationId: 'logout',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Logout exitoso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Logout exitoso',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/auth/logout-all': {
    post: {
      tags: ['Auth - Shared'],
      summary: 'Cerrar sesión en todos los dispositivos',
      description: 'Cierra la sesión del usuario en todos los dispositivos.',
      operationId: 'logoutAll',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Logout exitoso en todos los dispositivos',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/LogoutAllResponse'
                      }
                    }
                  }
                ]
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Logout exitoso en todos los dispositivos',
                data: {
                  count: 3
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/auth/sessions': {
    get: {
      tags: ['Auth - Shared'],
      summary: 'Obtener sesiones activas',
      description: 'Obtiene todas las sesiones activas del usuario actual.',
      operationId: 'getActiveSessions',
      security: [{ BearerAuth: [] }],
      responses: {
        200: {
          description: 'Sesiones activas',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        $ref: '#/components/schemas/ActiveSessionsResponse'
                      }
                    }
                  }
                ]
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/auth/sessions/{deviceFingerprint}': {
    delete: {
      tags: ['Auth - Shared'],
      summary: 'Cerrar sesión en dispositivo específico',
      description: 'Cierra la sesión del usuario en un dispositivo específico.',
      operationId: 'logoutDevice',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          name: 'deviceFingerprint',
          in: 'path',
          required: true,
          schema: {
            type: 'string',
            example: 'abc123def456'
          },
          description: 'Huella digital del dispositivo a desconectar'
        }
      ],
      responses: {
        200: {
          description: 'Dispositivo desconectado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Dispositivo desconectado',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  }
};

module.exports = authPaths;