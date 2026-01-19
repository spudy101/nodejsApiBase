/**
 * Schemas para el módulo de autenticación (Shared)
 * Disponible en: /admin/api/auth y /client/api/auth
 */

const authSharedSchemas = {
  // ==================== REQUEST SCHEMAS ====================

  LoginRequest: {
    type: 'object',
    required: ['nationalId', 'password'],
    properties: {
      nationalId: {
        type: 'string',
        minLength: 6,
        maxLength: 20,
        example: '12345678',
        description: 'Número de documento nacional'
      },
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'Password123!',
        description: 'Contraseña del usuario (mínimo 8 caracteres, debe contener mayúscula, minúscula, número y carácter especial)'
      }
    }
  },

  VerifyMFARequest: {
    type: 'object',
    required: ['nationalId', 'totpCode', 'session'],
    properties: {
      nationalId: {
        type: 'string',
        minLength: 6,
        maxLength: 20,
        example: '12345678',
        description: 'Número de documento nacional'
      },
      totpCode: {
        type: 'string',
        minLength: 6,
        maxLength: 6,
        pattern: '^[0-9]{6}$',
        example: '123456',
        description: 'Código TOTP de 6 dígitos'
      },
      session: {
        type: 'string',
        example: 'AYABeG...',
        description: 'Token de sesión MFA proporcionado en el login'
      }
    }
  },

  RefreshTokenRequest: {
    type: 'object',
    required: ['nationalId'],
    properties: {
      nationalId: {
        type: 'string',
        minLength: 6,
        maxLength: 20,
        example: '12345678',
        description: 'Número de documento nacional'
      }
    }
  },

  // ==================== RESPONSE SCHEMAS ====================

  LoginResponse: {
    type: 'object',
    required: ['user', 'tokens'],
    properties: {
      user: {
        type: 'object',
        required: ['userId', 'username', 'isActive', 'mfaEnabled'],
        properties: {
          userId: {
            $ref: '#/components/schemas/UUID'
          },
          username: {
            type: 'string',
            example: 'usuario@example.com',
            description: 'Nombre de usuario'
          },
          isActive: {
            type: 'boolean',
            example: true,
            description: 'Indica si el usuario está activo'
          },
          mfaEnabled: {
            type: 'boolean',
            example: false,
            description: 'Indica si el usuario tiene MFA habilitado'
          },
          person: {
            type: 'object',
            nullable: true,
            properties: {
              personId: {
                $ref: '#/components/schemas/UUID'
              },
              firstName: {
                type: 'string',
                example: 'Juan',
                description: 'Nombre de la persona'
              },
              lastName: {
                type: 'string',
                example: 'Pérez',
                description: 'Apellido de la persona'
              },
              nationalId: {
                type: 'string',
                example: '12345678',
                description: 'Número de documento nacional'
              },
              birthDate: {
                $ref: '#/components/schemas/Date'
              },
              genderId: {
                $ref: '#/components/schemas/UUID'
              },
              countryId: {
                $ref: '#/components/schemas/UUID'
              }
            }
          },
          role: {
            type: 'object',
            nullable: true,
            properties: {
              roleId: {
                $ref: '#/components/schemas/UUID'
              },
              name: {
                type: 'string',
                example: 'CLIENT',
                description: 'Nombre del rol'
              },
              description: {
                type: 'string',
                example: 'Usuario cliente',
                description: 'Descripción del rol'
              }
            }
          },
          avatar: {
            type: 'object',
            nullable: true,
            properties: {
              avatarId: {
                $ref: '#/components/schemas/UUID'
              },
              url: {
                type: 'string',
                format: 'uri',
                example: 'https://example.com/avatars/user.jpg',
                description: 'URL del avatar'
              }
            }
          }
        }
      },
      tokens: {
        type: 'object',
        required: ['accessToken', 'idToken', 'refreshToken', 'expiresIn'],
        properties: {
          accessToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Token de acceso JWT'
          },
          idToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Token de identidad JWT'
          },
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Token de refresco'
          },
          expiresIn: {
            type: 'integer',
            example: 3600,
            description: 'Tiempo de expiración del token en segundos'
          }
        }
      }
    }
  },

  MFARequiredResponse: {
    type: 'object',
    required: ['requiresMFA', 'challengeType', 'session'],
    properties: {
      requiresMFA: {
        type: 'boolean',
        example: true,
        description: 'Indica que se requiere verificación MFA'
      },
      challengeType: {
        type: 'string',
        example: 'SOFTWARE_TOKEN_MFA',
        enum: ['SOFTWARE_TOKEN_MFA', 'SMS_MFA'],
        description: 'Tipo de desafío MFA'
      },
      session: {
        type: 'string',
        example: 'AYABeG...',
        description: 'Token de sesión MFA para completar la autenticación'
      }
    }
  },

  RefreshTokenResponse: {
    type: 'object',
    required: ['accessToken', 'idToken', 'expiresIn'],
    properties: {
      accessToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Nuevo token de acceso JWT'
      },
      idToken: {
        type: 'string',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        description: 'Nuevo token de identidad JWT'
      },
      expiresIn: {
        type: 'integer',
        example: 3600,
        description: 'Tiempo de expiración del token en segundos'
      }
    }
  },

  ActiveSessionResponse: {
    type: 'object',
    required: ['attemptId', 'deviceFingerprint', 'ipAddress', 'lastActivity', 'loginTime', 'isCurrent'],
    properties: {
      attemptId: {
        $ref: '#/components/schemas/UUID'
      },
      deviceFingerprint: {
        type: 'string',
        example: 'abc123def456',
        description: 'Huella digital del dispositivo'
      },
      ipAddress: {
        type: 'string',
        format: 'ipv4',
        example: '192.168.1.1',
        description: 'Dirección IP del dispositivo'
      },
      lastActivity: {
        $ref: '#/components/schemas/Timestamp'
      },
      loginTime: {
        $ref: '#/components/schemas/Timestamp'
      },
      isCurrent: {
        type: 'boolean',
        example: true,
        description: 'Indica si es la sesión actual'
      },
      deviceInfo: {
        type: 'object',
        nullable: true,
        description: 'Información adicional del dispositivo (opcional)',
        additionalProperties: true
      }
    }
  },

  ActiveSessionsResponse: {
    type: 'object',
    required: ['sessions', 'totalActive'],
    properties: {
      sessions: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ActiveSessionResponse'
        }
      },
      totalActive: {
        type: 'integer',
        example: 3,
        minimum: 0,
        description: 'Total de sesiones activas'
      }
    }
  },

  LogoutAllResponse: {
    type: 'object',
    required: ['count'],
    properties: {
      count: {
        type: 'integer',
        example: 3,
        minimum: 0,
        description: 'Cantidad de sesiones cerradas'
      }
    }
  }
};

module.exports = authSharedSchemas;