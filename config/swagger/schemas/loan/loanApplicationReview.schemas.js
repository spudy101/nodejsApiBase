/**
 * Schemas para Loan Application Reviews
 * Corresponden a los DTOs en loanApplicationReview.dto.js
 */

const loanApplicationReviewSchemas = {
  // ==================== LOAN APPLICATION REVIEW DTO ====================

  LoanApplicationReview: {
    type: 'object',
    required: ['review_id', 'attempt_id', 'product_loan_id', 'status', 'created_at'],
    properties: {
      review_id: {
        $ref: '#/components/schemas/UUID'
      },
      attempt_id: {
        $ref: '#/components/schemas/UUID'
      },
      product_loan_id: {
        $ref: '#/components/schemas/UUID'
      },
      product_version: {
        type: 'integer',
        nullable: true,
        example: 1,
        description: 'Versión del producto al momento de la review'
      },
      status: {
        type: 'string',
        enum: ['pending_cosigner', 'pending_admin', 'approved', 'rejected'],
        example: 'pending_admin',
        description: 'Estado de la solicitud de revisión'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-17T11:00:00.000Z',
        description: 'Última actualización'
      },
      attempt: {
        type: 'object',
        description: 'Información del intento original',
        properties: {
          requested_amount: {
            type: 'number',
            format: 'float',
            example: 5000000,
            description: 'Monto solicitado original'
          },
          approved_amount: {
            type: 'number',
            format: 'float',
            nullable: true,
            example: 4500000,
            description: 'Monto pre-aprobado en validación'
          },
          term_months: {
            type: 'integer',
            example: 12,
            description: 'Plazo en meses'
          },
          validation_result: {
            type: 'string',
            enum: ['approved', 'rejected', 'pending'],
            example: 'approved',
            description: 'Resultado de validación automática'
          },
          risk_level: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            nullable: true,
            example: 'medium',
            description: 'Nivel de riesgo'
          }
        }
      },
      product: {
        type: 'object',
        description: 'Información básica del producto',
        properties: {
          product_code: {
            type: 'string',
            example: 'CONSUMER_LOAN_V1',
            description: 'Código del producto'
          },
          product_name: {
            type: 'string',
            example: 'Préstamo de Consumo',
            description: 'Nombre del producto'
          }
        }
      },
      applicant: {
        $ref: '#/components/schemas/LoanParticipant'
      },
      cosigner: {
        allOf: [
          { $ref: '#/components/schemas/LoanParticipant' },
          {
            type: 'object',
            properties: {
              debtor_cosigner_id: {
                $ref: '#/components/schemas/UUID'
              },
              is_primary: {
                type: 'boolean',
                example: false,
                description: 'Indica si es codeudor primario'
              }
            }
          }
        ]
      },
      payment_terms: {
        type: 'object',
        description: 'Snapshot de términos de pago del producto',
        additionalProperties: true
      },
      interest_and_fees: {
        type: 'object',
        description: 'Snapshot de tasas y comisiones del producto',
        additionalProperties: true
      },
      vat_percentage: {
        type: 'number',
        format: 'float',
        example: 19,
        description: 'Porcentaje de IVA aplicado'
      },
      modifications: {
        type: 'object',
        nullable: true,
        description: 'Modificaciones realizadas por admin (si existen)',
        properties: {
          requested_amount: {
            type: 'number',
            format: 'float',
            nullable: true,
            example: 4800000,
            description: 'Monto solicitado modificado'
          },
          approved_amount: {
            type: 'number',
            format: 'float',
            nullable: true,
            example: 4300000,
            description: 'Monto aprobado modificado'
          }
        }
      },
      review_info: {
        type: 'object',
        nullable: true,
        description: 'Información del revisor (si fue revisado)',
        properties: {
          reviewed_by: {
            $ref: '#/components/schemas/UUID'
          },
          reviewed_at: {
            $ref: '#/components/schemas/Timestamp'
          },
          reviewer_name: {
            type: 'string',
            example: 'admin_user',
            description: 'Nombre del usuario que revisó'
          }
        }
      },
      cosigner_acceptance: {
        type: 'object',
        nullable: true,
        description: 'Estado de aceptación del codeudor',
        properties: {
          accepted: {
            type: 'boolean',
            example: true,
            description: 'Si el codeudor aceptó'
          },
          accepted_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2024-01-17T09:00:00.000Z'
          },
          rejected_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: null
          }
        }
      },
      rejection_reasons: {
        type: 'array',
        nullable: true,
        description: 'Razones de rechazo (si fue rechazado)',
        items: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: {
              type: 'string',
              example: 'insufficient_income',
              description: 'Código de la razón'
            },
            message: {
              type: 'string',
              example: 'Ingresos insuficientes para el monto solicitado',
              description: 'Mensaje descriptivo'
            }
          }
        }
      },
      rejection_notes: {
        type: 'string',
        nullable: true,
        example: 'Notas adicionales del rechazo',
        description: 'Notas del admin sobre el rechazo'
      },
      requires_second_approval: {
        type: 'boolean',
        example: false,
        description: 'Indica si requiere aprobación de segundo admin'
      },
      change_request_id: {
        $ref: '#/components/schemas/UUID',
        nullable: true
      }
    }
  },

  // ==================== LOAN APPLICATION REVIEW DETAIL DTO ====================

  LoanApplicationReviewDetail: {
    allOf: [
      { $ref: '#/components/schemas/LoanApplicationReview' },
      {
        type: 'object',
        properties: {
          financial_details: {
            $ref: '#/components/schemas/LoanFinancialDetails'
          },
          attempt_details: {
            type: 'object',
            description: 'Información adicional del attempt',
            properties: {
              attempt_id: {
                $ref: '#/components/schemas/UUID'
              },
              channel: {
                type: 'string',
                example: 'web',
                description: 'Canal de origen'
              },
              validation_result: {
                type: 'string',
                enum: ['approved', 'rejected', 'pending'],
                example: 'approved'
              },
              user_message: {
                type: 'string',
                nullable: true,
                example: 'Su solicitud fue pre-aprobada',
                description: 'Mensaje para el usuario'
              },
              created_at: {
                $ref: '#/components/schemas/Timestamp'
              }
            }
          },
          credit_analysis: {
            $ref: '#/components/schemas/CreditCapacityAnalysis'
          },
          product_details: {
            $ref: '#/components/schemas/LoanProduct'
          },
          cosigner_info: {
            $ref: '#/components/schemas/CosignerInfo'
          },
          change_request_details: {
            type: 'object',
            nullable: true,
            description: 'Detalles de la solicitud de cambios (si existe)',
            properties: {
              change_request_id: {
                $ref: '#/components/schemas/UUID'
              },
              status: {
                type: 'string',
                enum: ['pending', 'approved', 'rejected'],
                example: 'pending',
                description: 'Estado de la solicitud de cambios'
              },
              change_description: {
                type: 'string',
                example: 'Ajuste de monto aprobado por capacidad de pago',
                description: 'Descripción de los cambios solicitados'
              },
              previous_values: {
                type: 'object',
                description: 'Valores previos antes de los cambios'
              },
              new_values: {
                type: 'object',
                description: 'Nuevos valores propuestos'
              },
              requested_by: {
                $ref: '#/components/schemas/UUID'
              },
              reviewed_by: {
                $ref: '#/components/schemas/UUID',
                nullable: true
              },
              reviewed_at: {
                type: 'string',
                format: 'date-time',
                nullable: true
              }
            }
          }
        }
      }
    ]
  },

  // ==================== LOAN APPLICATION REVIEW LIST DTO ====================

  LoanApplicationReviewList: {
    type: 'object',
    required: ['review_id', 'status', 'created_at', 'cosigner_person_id', 'aplicant_person_id'],
    properties: {
      review_id: {
        $ref: '#/components/schemas/UUID'
      },
      cosigner_person_id: {
        $ref: '#/components/schemas/UUID'
      },
      aplicant_person_id: {
        $ref: '#/components/schemas/UUID'
      },
      status: {
        type: 'string',
        enum: ['pending_cosigner', 'pending_admin', 'approved', 'rejected'],
        example: 'pending_admin'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      product_name: {
        type: 'string',
        example: 'Préstamo de Consumo',
        description: 'Nombre del producto'
      },
      product_code: {
        type: 'string',
        example: 'CONSUMER_LOAN_V1',
        description: 'Código del producto'
      },
      requested_amount: {
        type: 'number',
        format: 'float',
        example: 5000000,
        description: 'Monto solicitado'
      },
      approved_amount: {
        type: 'number',
        format: 'float',
        nullable: true,
        example: 4500000,
        description: 'Monto aprobado'
      },
      term_months: {
        type: 'integer',
        example: 12,
        description: 'Plazo en meses'
      },
      has_modifications: {
        type: 'boolean',
        example: false,
        description: 'Indica si tiene modificaciones del admin'
      },
      requires_second_approval: {
        type: 'boolean',
        example: false,
        description: 'Indica si requiere segundo admin'
      },
      applicant_name: {
        type: 'string',
        example: 'Juan Pérez',
        description: 'Nombre del aplicante'
      },
      cosigner_name: {
        type: 'string',
        nullable: true,
        example: 'María González',
        description: 'Nombre del codeudor (si existe)'
      },
      has_cosigner: {
        type: 'boolean',
        example: true,
        description: 'Indica si tiene codeudor'
      }
    }
  },

  // ==================== CREATE REVIEW RESPONSE DTO ====================

  CreateReviewResponse: {
    type: 'object',
    required: ['review_id', 'attempt_id', 'status', 'requires_cosigner_acceptance', 'created_at', 'message'],
    properties: {
      review_id: {
        $ref: '#/components/schemas/UUID'
      },
      attempt_id: {
        $ref: '#/components/schemas/UUID'
      },
      status: {
        type: 'string',
        enum: ['pending_cosigner', 'pending_admin'],
        example: 'pending_admin',
        description: 'Estado inicial de la review'
      },
      requires_cosigner_acceptance: {
        type: 'boolean',
        example: false,
        description: 'Indica si requiere aceptación del codeudor primero'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      message: {
        type: 'string',
        example: 'Solicitud enviada al equipo de revisión.',
        description: 'Mensaje descriptivo del resultado'
      }
    }
  },

  // ==================== REQUEST BODIES ====================

  CreateReviewRequest: {
    type: 'object',
    required: ['attempt_id'],
    properties: {
      attempt_id: {
        $ref: '#/components/schemas/UUID',
        description: 'ID del intento de préstamo que se enviará a revisión'
      }
    }
  },

  CosignerActionRequest: {
    type: 'object',
    required: ['action'],
    properties: {
      action: {
        type: 'string',
        enum: ['accept', 'reject'],
        example: 'accept',
        description: 'Acción del codeudor'
      }
    }
  },

  AdminApproveRequest: {
    type: 'object',
    properties: {
      notes: {
        type: 'string',
        maxLength: 2000,
        nullable: true,
        example: 'Solicitud aprobada sin observaciones',
        description: 'Notas del administrador'
      }
    }
  },

  AdminApproveWithChangesRequest: {
    type: 'object',
    required: ['modifications', 'change_description'],
    properties: {
      modifications: {
        type: 'object',
        description: 'Modificaciones a aplicar',
        properties: {
          requested_amount: {
            type: 'number',
            format: 'float',
            minimum: 0,
            example: 4800000,
            description: 'Nuevo monto solicitado'
          },
          approved_amount: {
            type: 'number',
            format: 'float',
            minimum: 0,
            example: 4300000,
            description: 'Nuevo monto aprobado'
          },
          interest_and_fees: {
            type: 'object',
            description: 'Nuevas tasas y comisiones',
            properties: {
              annual_percentage_rate: {
                type: 'number',
                format: 'float',
                minimum: 0,
                maximum: 100,
                example: 17.5
              },
              origination_fee_amount: {
                type: 'number',
                format: 'float',
                minimum: 0,
                example: 140000
              },
              loan_insurance_percentage: {
                type: 'number',
                format: 'float',
                minimum: 0,
                maximum: 100,
                example: 2.3
              }
            }
          },
          payment_terms: {
            type: 'object',
            description: 'Nuevos términos de pago'
          },
          vat_percentage: {
            type: 'number',
            format: 'float',
            minimum: 0,
            maximum: 100,
            example: 19
          }
        }
      },
      change_description: {
        type: 'string',
        minLength: 10,
        maxLength: 5000,
        example: 'Ajuste de monto aprobado debido a capacidad de pago limitada según análisis de ingresos',
        description: 'Descripción detallada de los cambios'
      },
      notes: {
        type: 'string',
        maxLength: 2000,
        nullable: true,
        example: 'Requiere verificación de segundo administrador',
        description: 'Notas adicionales'
      }
    }
  },

  AdminRejectRequest: {
    type: 'object',
    required: ['rejection_reasons'],
    properties: {
      rejection_reasons: {
        type: 'array',
        minItems: 1,
        description: 'Razones del rechazo',
        items: {
          type: 'object',
          required: ['code', 'message'],
          properties: {
            code: {
              type: 'string',
              example: 'insufficient_income',
              description: 'Código de la razón'
            },
            message: {
              type: 'string',
              example: 'Ingresos insuficientes para el monto solicitado',
              description: 'Mensaje descriptivo'
            }
          }
        }
      },
      rejection_notes: {
        type: 'string',
        maxLength: 2000,
        nullable: true,
        example: 'El análisis de capacidad de pago indica que el solicitante no puede asumir la deuda',
        description: 'Notas adicionales del rechazo'
      }
    }
  },

  SecondAdminApproveRequest: {
    type: 'object',
    properties: {
      review_notes: {
        type: 'string',
        maxLength: 2000,
        nullable: true,
        example: 'Cambios revisados y aprobados',
        description: 'Notas de la revisión del segundo admin'
      }
    }
  },

  SecondAdminRejectRequest: {
    type: 'object',
    required: ['review_notes'],
    properties: {
      review_notes: {
        type: 'string',
        minLength: 10,
        maxLength: 2000,
        example: 'Las modificaciones propuestas no están justificadas según la política de crédito',
        description: 'Razón del rechazo de los cambios'
      }
    }
  },

  // ==================== RESPONSE TYPES ====================

  CosignerActionResponse: {
    type: 'object',
    required: ['review_id', 'status', 'message'],
    properties: {
      review_id: {
        $ref: '#/components/schemas/UUID'
      },
      status: {
        type: 'string',
        enum: ['pending_admin', 'rejected'],
        example: 'pending_admin',
        description: 'Nuevo estado después de la acción'
      },
      message: {
        type: 'string',
        example: 'Has aceptado la solicitud. Ahora será revisada por el equipo administrativo.',
        description: 'Mensaje confirmatorio'
      }
    }
  },

  AdminActionResponse: {
    type: 'object',
    required: ['review_id', 'status', 'message'],
    properties: {
      review_id: {
        $ref: '#/components/schemas/UUID'
      },
      offer_id: {
        $ref: '#/components/schemas/UUID',
        nullable: true,
        description: 'ID de la oferta creada (solo cuando se aprueba directamente)'
      },
      change_request_id: {
        $ref: '#/components/schemas/UUID',
        nullable: true,
        description: 'ID de la solicitud de cambios (cuando se aprueba con modificaciones)'
      },
      status: {
        type: 'string',
        enum: ['approved', 'rejected', 'pending_second_approval'],
        example: 'approved',
        description: 'Nuevo estado'
      },
      message: {
        type: 'string',
        example: 'Solicitud aprobada exitosamente. Se ha creado una oferta para el cliente.',
        description: 'Mensaje confirmatorio'
      }
    }
  },

  SecondAdminActionResponse: {
    type: 'object',
    required: ['review_id', 'status', 'message'],
    properties: {
      review_id: {
        $ref: '#/components/schemas/UUID'
      },
      offer_id: {
        $ref: '#/components/schemas/UUID',
        nullable: true,
        description: 'ID de la oferta creada (cuando se aprueba)'
      },
      status: {
        type: 'string',
        enum: ['approved', 'pending_admin'],
        example: 'approved',
        description: 'Nuevo estado'
      },
      message: {
        type: 'string',
        example: 'Cambios aprobados exitosamente. Se ha creado una oferta con las modificaciones.',
        description: 'Mensaje confirmatorio'
      }
    }
  }
};

module.exports = loanApplicationReviewSchemas;