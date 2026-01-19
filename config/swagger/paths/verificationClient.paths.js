const commonResponses = require('../responses/common.responses');

const verificationClientPaths = {
  '/client/api/verification/send-verification': {
    post: {
      tags: ['Verification - Client'],
      summary: 'Enviar código de verificación',
      description: 'Envía un código de verificación al email o teléfono proporcionado. El código tiene una validez de 15 minutos y se permite un máximo de 5 intentos de verificación.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/SendVerificationRequest' },
            examples: {
              email: {
                summary: 'Verificación por email',
                value: {
                  type: 'email',
                  contact: 'usuario@example.com'
                }
              },
              phone: {
                summary: 'Verificación por teléfono',
                value: {
                  type: 'phone',
                  contact: '+56912345678',
                  phone_prefix_id: '123e4567-e89b-12d3-a456-426614174000'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Código de verificación enviado exitosamente',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SendVerificationSuccessResponse' },
              example: {
                success: true,
                statusCode: 200,
                message: 'Código de verificación enviado',
                data: {
                  codeId: '123e4567-e89b-12d3-a456-426614174000',
                  expiresAt: '2024-01-17T10:45:00.000Z'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        422: commonResponses.ValidationError,
        429: commonResponses.RateLimitExceeded,
        500: commonResponses.InternalServerError
      }
    }
  },

  '/client/api/verification/verify-code': {
    post: {
      tags: ['Verification - Client'],
      summary: 'Verificar código',
      description: 'Verifica el código de verificación enviado al email o teléfono. Se permiten hasta 5 intentos antes de que el código sea bloqueado.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/VerifyCodeRequest' },
            examples: {
              email: {
                summary: 'Verificar código de email',
                value: {
                  type: 'email',
                  contact: 'usuario@example.com',
                  code: '123456'
                }
              },
              phone: {
                summary: 'Verificar código de teléfono',
                value: {
                  type: 'phone',
                  contact: '+56912345678',
                  code: '123456'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Código verificado exitosamente',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/VerifyCodeSuccessResponse' },
              example: {
                success: true,
                statusCode: 200,
                message: 'Código verificado exitosamente',
                data: {
                  verified: true
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        403: commonResponses.Forbidden,
        404: commonResponses.NotFound,
        422: commonResponses.ValidationError,
        429: commonResponses.RateLimitExceeded,
        500: commonResponses.InternalServerError
      }
    }
  }
};

module.exports = verificationClientPaths;