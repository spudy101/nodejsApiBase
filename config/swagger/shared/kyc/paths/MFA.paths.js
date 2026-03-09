'use strict';

/**
 * Paths de KYC MFA para Swagger
 */

const MFAPaths = {
  '/<admin>o<client>/api/kyc/mfa/setup-totp': {
    post: {
      tags: ['KYC MFA - Shared'],
      summary: 'Configurar TOTP para el usuario',
      description: 'Genera el código secreto y retorna la URL otpauth para escanear el código QR en la aplicación de autenticación',
      security: [
        {
          BearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'TOTP configurado correctamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TOTPSetupResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'TOTP configurado correctamente',
                data: {
                  otpauthUrl: 'otpauth://totp/DemocraciaLiquida:usuario@example.com?secret=JBSWY3DPEHPK3PXP&issuer=DemocraciaLiquida',
                  secretCode: 'JBSWY3DPEHPK3PXP',
                  username: 'usuario@example.com',
                  instructions: 'Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.) y verifica el código generado para activar TOTP.'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        409: {
          description: 'TOTP ya está activado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'TOTP ya está activado para este usuario',
                errorCode: 'CONFLICT',
                timestamp: '2024-01-17T10:30:00.000Z'
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

  '/<admin>o<client>/api/kyc/mfa/activate-totp': {
    post: {
      tags: ['KYC MFA - Shared'],
      summary: 'Activar TOTP para el usuario',
      description: 'Verifica el código TOTP generado por la aplicación y activa MFA si es correcto',
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
              $ref: '#/components/schemas/ActivateTOTPRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'TOTP activado correctamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TOTPActivationResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'TOTP activado correctamente',
                data: {
                  userId: '123e4567-e89b-12d3-a456-426614174000',
                  username: 'usuario@example.com',
                  totpEnabled: true
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: {
          description: 'Código TOTP inválido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 400,
                message: 'Código TOTP inválido',
                errorCode: 'BAD_REQUEST',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        409: {
          description: 'TOTP ya está activado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'TOTP ya está activado',
                errorCode: 'CONFLICT',
                timestamp: '2024-01-17T10:30:00.000Z'
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

  '/<admin>o<client>/api/kyc/mfa/verify-totp': {
    post: {
      tags: ['KYC MFA - Shared'],
      summary: 'Verificar código TOTP',
      description: 'Verifica un código TOTP (para login con MFA u otras validaciones)',
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
              $ref: '#/components/schemas/VerifyTOTPRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Código TOTP válido',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TOTPVerificationResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Código TOTP válido',
                data: {
                  valid: true,
                  username: 'usuario@example.com'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: {
          description: 'TOTP no está activado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 400,
                message: 'TOTP no está activado para este usuario',
                errorCode: 'BAD_REQUEST',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
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

  '/<admin>o<client>/api/kyc/mfa/validate-password': {
    post: {
      tags: ['KYC MFA - Shared'],
      summary: 'Validar contraseña del usuario',
      description: 'Valida la contraseña del usuario (útil para validaciones adicionales en el frontend)',
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
              $ref: '#/components/schemas/ValidatePasswordRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Contraseña válida',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PasswordValidationResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Contraseña válida',
                data: {
                  valid: true,
                  username: 'usuario@example.com'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
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

  '/<admin>o<client>/api/kyc/mfa/deactivate-totp': {
    post: {
      tags: ['KYC MFA - Shared'],
      summary: 'Desactivar TOTP para el usuario',
      description: 'Desactiva TOTP para el usuario. Requiere validación de contraseña por seguridad',
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
              $ref: '#/components/schemas/DeactivateTOTPRequest'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'TOTP desactivado correctamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/TOTPActivationResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'TOTP desactivado correctamente',
                data: {
                  userId: '123e4567-e89b-12d3-a456-426614174000',
                  username: 'usuario@example.com',
                  totpEnabled: false
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: {
          description: 'TOTP no está activado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 400,
                message: 'TOTP no está activado',
                errorCode: 'BAD_REQUEST',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: {
          description: 'Contraseña incorrecta o no autorizado',
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
                wrongPassword: {
                  summary: 'Contraseña incorrecta',
                  value: {
                    success: false,
                    statusCode: 401,
                    message: 'Contraseña incorrecta',
                    errorCode: 'UNAUTHORIZED',
                    timestamp: '2024-01-17T10:30:00.000Z'
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
  }
};

module.exports = MFAPaths;