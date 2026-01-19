'use strict';

/**
 * Schemas de KYC MFA para Swagger
 */

const kycMFASchemas = {
  // ==================== REQUEST BODIES ====================

  ActivateTOTPRequest: {
    type: 'object',
    required: ['totpCode'],
    properties: {
      totpCode: {
        type: 'string',
        minLength: 4,
        maxLength: 8,
        example: '123456',
        description: 'Código TOTP generado por la aplicación de autenticación'
      }
    }
  },

  VerifyTOTPRequest: {
    type: 'object',
    required: ['totpCode'],
    properties: {
      totpCode: {
        type: 'string',
        minLength: 4,
        maxLength: 8,
        example: '123456',
        description: 'Código TOTP a verificar'
      }
    }
  },

  ValidatePasswordRequest: {
    type: 'object',
    required: ['password'],
    properties: {
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'Password123!',
        description: 'Contraseña del usuario a validar'
      }
    }
  },

  DeactivateTOTPRequest: {
    type: 'object',
    required: ['password'],
    properties: {
      password: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'Password123!',
        description: 'Contraseña del usuario para confirmar desactivación'
      }
    }
  },

  // ==================== RESPONSE DATA ====================

  TOTPSetupData: {
    type: 'object',
    properties: {
      otpauthUrl: {
        type: 'string',
        format: 'uri',
        example: 'otpauth://totp/DemocraciaLiquida:usuario@example.com?secret=JBSWY3DPEHPK3PXP&issuer=DemocraciaLiquida',
        description: 'URL para generar código QR en la aplicación de autenticación'
      },
      secretCode: {
        type: 'string',
        example: 'JBSWY3DPEHPK3PXP',
        description: 'Código secreto para configuración manual'
      },
      username: {
        type: 'string',
        example: 'usuario@example.com',
        description: 'Username del usuario'
      },
      instructions: {
        type: 'string',
        example: 'Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.) y verifica el código generado para activar TOTP.',
        description: 'Instrucciones para el usuario'
      }
    }
  },

  TOTPActivationData: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del usuario'
      },
      username: {
        type: 'string',
        example: 'usuario@example.com',
        description: 'Username del usuario'
      },
      totpEnabled: {
        type: 'boolean',
        example: true,
        description: 'Estado de TOTP (activado/desactivado)'
      }
    }
  },

  TOTPVerificationData: {
    type: 'object',
    properties: {
      valid: {
        type: 'boolean',
        example: true,
        description: 'Indica si el código TOTP es válido'
      },
      username: {
        type: 'string',
        example: 'usuario@example.com',
        description: 'Username del usuario'
      }
    }
  },

  PasswordValidationData: {
    type: 'object',
    properties: {
      valid: {
        type: 'boolean',
        example: true,
        description: 'Indica si la contraseña es válida'
      },
      username: {
        type: 'string',
        example: 'usuario@example.com',
        description: 'Username del usuario'
      }
    }
  },

  // ==================== COMPLETE RESPONSES ====================

  TOTPSetupResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/TOTPSetupData'
          }
        }
      }
    ]
  },

  TOTPActivationResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/TOTPActivationData'
          }
        }
      }
    ]
  },

  TOTPVerificationResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/TOTPVerificationData'
          }
        }
      }
    ]
  },

  PasswordValidationResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/PasswordValidationData'
          }
        }
      }
    ]
  }
};

module.exports = kycMFASchemas;