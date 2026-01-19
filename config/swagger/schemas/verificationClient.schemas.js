const VerificationClientSchemas = {
  // Request schemas
  SendVerificationRequest: {
    type: 'object',
    required: ['type', 'contact'],
    properties: {
      type: {
        type: 'string',
        enum: ['email', 'phone'],
        example: 'email',
        description: 'Tipo de verificación'
      },
      contact: {
        type: 'string',
        example: 'usuario@example.com',
        description: 'Email o número de teléfono según el tipo'
      },
      phone_prefix_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del prefijo telefónico (requerido solo para type=phone)'
      }
    }
  },

  VerifyCodeRequest: {
    type: 'object',
    required: ['type', 'contact', 'code'],
    properties: {
      type: {
        type: 'string',
        enum: ['email', 'phone'],
        example: 'email',
        description: 'Tipo de verificación'
      },
      contact: {
        type: 'string',
        example: 'usuario@example.com',
        description: 'Email o número de teléfono según el tipo'
      },
      code: {
        type: 'string',
        minLength: 4,
        maxLength: 8,
        example: '123456',
        description: 'Código de verificación recibido'
      }
    }
  },

  // Response schemas
  SendVerificationResponse: {
    type: 'object',
    properties: {
      codeId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del código de verificación generado'
      },
      expiresAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:45:00.000Z',
        description: 'Fecha y hora de expiración del código'
      }
    }
  },

  VerifyCodeResponse: {
    type: 'object',
    properties: {
      verified: {
        type: 'boolean',
        example: true,
        description: 'Indica si el código fue verificado exitosamente'
      }
    }
  },

  // Success responses usando common schemas
  SendVerificationSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/SendVerificationResponse' }
        }
      }
    ]
  },

  VerifyCodeSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/VerifyCodeResponse' }
        }
      }
    ]
  }
};

module.exports = VerificationClientSchemas;