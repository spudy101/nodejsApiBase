/**
 * Schemas de Swagger para el módulo KYC Profile
 * Define todos los componentes/schemas utilizados en los endpoints de perfil KYC
 */

const profileSchemas = {
  // ==================== PROFILE COMPLETENESS ====================

  ProfileCompletenessResponse: {
    type: 'object',
    required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
    properties: {
      success: {
        type: 'boolean',
        example: true,
        description: 'Indica si la operación fue exitosa'
      },
      statusCode: {
        type: 'integer',
        example: 200,
        description: 'Código de estado HTTP'
      },
      message: {
        type: 'string',
        example: 'Completitud de perfil obtenida exitosamente',
        description: 'Mensaje descriptivo de la operación'
      },
      data: {
        $ref: '#/components/schemas/ProfileCompletenessData'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Timestamp de la respuesta'
      }
    }
  },

  ProfileCompletenessData: {
    type: 'object',
    required: ['percentage', 'isComplete', 'completedFields', 'missingFields', 'pendingFields', 'details'],
    properties: {
      percentage: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 100,
        example: 75,
        description: 'Porcentaje de completitud del perfil (0-100)'
      },
      isComplete: {
        type: 'boolean',
        example: false,
        description: 'Indica si el perfil está 100% completo'
      },
      completedFields: {
        type: 'array',
        items: {
          type: 'string'
        },
        example: [
          'email_verified',
          'phone_verified',
          'personal_data',
          'birth_date',
          'mfa_enabled',
          'location_data'
        ],
        description: 'Lista de campos completados y validados'
      },
      missingFields: {
        type: 'array',
        items: {
          type: 'string'
        },
        example: [],
        description: 'Lista de campos que no han sido iniciados'
      },
      pendingFields: {
        type: 'array',
        items: {
          type: 'string'
        },
        example: [
          'identity_validated',
          'screening_completed',
          'tax_residency_validated'
        ],
        description: 'Lista de campos pendientes de aprobación o en proceso de validación'
      },
      details: {
        type: 'object',
        description: 'Detalles de completitud por campo con pesos y estados',
        properties: {
          email_verified: {
            $ref: '#/components/schemas/FieldCompleteness'
          },
          phone_verified: {
            $ref: '#/components/schemas/FieldCompleteness'
          },
          personal_data: {
            $ref: '#/components/schemas/FieldCompleteness'
          },
          birth_date: {
            $ref: '#/components/schemas/FieldCompleteness'
          },
          identity_validated: {
            $ref: '#/components/schemas/FieldCompleteness'
          },
          mfa_enabled: {
            $ref: '#/components/schemas/FieldCompleteness'
          },
          location_data: {
            $ref: '#/components/schemas/FieldCompleteness'
          },
          screening_completed: {
            $ref: '#/components/schemas/FieldCompleteness'
          },
          tax_residency_validated: {
            $ref: '#/components/schemas/FieldCompleteness'
          }
        },
        example: {
          email_verified: {
            completed: true,
            weight: 15,
            description: 'Email verificado'
          },
          phone_verified: {
            completed: true,
            weight: 15,
            description: 'Teléfono verificado'
          },
          personal_data: {
            completed: true,
            weight: 10,
            description: 'Nombre y apellido'
          },
          birth_date: {
            completed: true,
            weight: 5,
            description: 'Fecha de nacimiento'
          },
          identity_validated: {
            completed: false,
            pending: true,
            weight: 25,
            description: 'Identidad validada (ZapSign)'
          },
          mfa_enabled: {
            completed: true,
            weight: 10,
            description: 'MFA activado'
          },
          location_data: {
            completed: true,
            weight: 5,
            description: 'Dirección del usuario'
          },
          screening_completed: {
            completed: false,
            pending: true,
            weight: 15,
            description: 'Preguntas iniciales de screening completadas'
          },
          tax_residency_validated: {
            completed: false,
            pending: true,
            weight: 10,
            description: 'Tax Residency validada'
          }
        }
      }
    }
  },

  FieldCompleteness: {
    type: 'object',
    required: ['completed', 'weight', 'description'],
    properties: {
      completed: {
        type: 'boolean',
        example: true,
        description: 'Indica si el campo está completado y validado'
      },
      pending: {
        type: 'boolean',
        example: false,
        description: 'Indica si el campo está pendiente de aprobación o validación (opcional)'
      },
      weight: {
        type: 'integer',
        minimum: 0,
        maximum: 25,
        example: 15,
        description: 'Peso del campo en el cálculo del porcentaje total (en puntos)'
      },
      description: {
        type: 'string',
        example: 'Email verificado',
        description: 'Descripción legible del campo'
      }
    }
  },

  // ==================== DEPRECATED - Mantener por compatibilidad ====================
  
  SectionCompleteness: {
    type: 'object',
    required: ['isComplete', 'completedFields', 'missingFields'],
    properties: {
      isComplete: {
        type: 'boolean',
        example: true,
        description: 'Indica si esta sección está completa'
      },
      completedFields: {
        type: 'array',
        items: {
          type: 'string'
        },
        example: ['first_name', 'last_name', 'birth_date'],
        description: 'Lista de campos completados en esta sección'
      },
      missingFields: {
        type: 'array',
        items: {
          type: 'string'
        },
        example: [],
        description: 'Lista de campos faltantes en esta sección'
      },
      rejectedFields: {
        type: 'array',
        items: {
          type: 'string'
        },
        example: [],
        description: 'Lista de campos rechazados en esta sección'
      }
    }
  }
};

module.exports = profileSchemas;