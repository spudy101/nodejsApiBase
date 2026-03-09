/**
 * Schemas para Loan Offers
 * Corresponden a los DTOs en loanOffer.dto.js
 */

const loanOfferSchemas = {
  // ==================== LOAN OFFER DTO ====================

  LoanOffer: {
    type: 'object',
    required: ['offer_id', 'review_id', 'attempt_id', 'status', 'expires_at', 'created_at', 'requested_amount', 'approved_amount', 'term_months'],
    properties: {
      offer_id: {
        $ref: '#/components/schemas/UUID'
      },
      review_id: {
        $ref: '#/components/schemas/UUID'
      },
      attempt_id: {
        $ref: '#/components/schemas/UUID'
      },
      status: {
        type: 'string',
        enum: ['pending_applicant', 'pending_cosigner', 'accepted', 'rejected', 'expired'],
        example: 'pending_applicant',
        description: 'Estado de la oferta'
      },
      expires_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-24T10:30:00.000Z',
        description: 'Fecha de expiración de la oferta'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      requested_amount: {
        type: 'number',
        format: 'float',
        example: 5000000,
        description: 'Monto solicitado final'
      },
      approved_amount: {
        type: 'number',
        format: 'float',
        example: 4500000,
        description: 'Monto aprobado final'
      },
      term_months: {
        type: 'integer',
        example: 12,
        description: 'Plazo en meses'
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
      has_cosigner: {
        type: 'boolean',
        example: true,
        description: 'Indica si tiene codeudor'
      },
      is_cosigner_primary: {
        type: 'boolean',
        nullable: true,
        example: false,
        description: 'Indica si el codeudor es primario'
      },
      applicant_accepted_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-17T11:00:00.000Z',
        description: 'Fecha de aceptación del aplicante'
      },
      cosigner_accepted_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null,
        description: 'Fecha de aceptación del codeudor'
      }
    }
  },

  // ==================== LOAN OFFER DETAIL DTO ====================

  LoanOfferDetail: {
    allOf: [
      { $ref: '#/components/schemas/LoanOffer' },
      {
        type: 'object',
        properties: {
          financial_details: {
            $ref: '#/components/schemas/LoanFinancialDetails'
          },
          credit_analysis: {
            $ref: '#/components/schemas/CreditCapacityAnalysis'
          },
          product_details: {
            $ref: '#/components/schemas/LoanProduct'
          },
          applicant: {
            $ref: '#/components/schemas/LoanParticipant'
          },
          cosigner_info: {
            $ref: '#/components/schemas/CosignerInfo'
          },
          acceptance_status: {
            $ref: '#/components/schemas/AcceptanceStatus'
          }
        }
      }
    ]
  },

  // ==================== LOAN OFFER LIST DTO ====================

  LoanOfferList: {
    type: 'object',
    required: ['offer_id', 'status', 'approved_amount', 'term_months', 'expires_at', 'created_at', 'cosigner_person_id', 'aplicant_person_id'],
    properties: {
      offer_id: {
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
        enum: ['pending_applicant', 'pending_cosigner', 'accepted', 'rejected', 'expired'],
        example: 'pending_applicant',
        description: 'Estado de la oferta'
      },
      approved_amount: {
        type: 'number',
        format: 'float',
        example: 4500000,
        description: 'Monto aprobado'
      },
      term_months: {
        type: 'integer',
        example: 12,
        description: 'Plazo en meses'
      },
      expires_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-24T10:30:00.000Z',
        description: 'Fecha de expiración'
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
      is_expired: {
        type: 'boolean',
        example: false,
        description: 'Indica si la oferta ya expiró'
      },
      has_cosigner: {
        type: 'boolean',
        example: true,
        description: 'Indica si tiene codeudor'
      },
      monthly_installment: {
        type: 'number',
        format: 'float',
        nullable: true,
        example: 456789.50,
        description: 'Cuota mensual estimada (si está disponible)'
      }
    }
  },

  // ==================== ACCEPT OFFER RESPONSE DTO ====================

  AcceptOfferResponse: {
    type: 'object',
    required: ['offer_id', 'status', 'message', 'accepted_at'],
    properties: {
      offer_id: {
        $ref: '#/components/schemas/UUID'
      },
      status: {
        type: 'string',
        enum: ['pending_cosigner', 'accepted'],
        example: 'accepted',
        description: 'Nuevo estado después de aceptar'
      },
      message: {
        type: 'string',
        example: '¡Felicitaciones! La oferta ha sido aceptada por todas las partes.',
        description: 'Mensaje descriptivo del resultado'
      },
      accepted_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T12:00:00.000Z',
        description: 'Fecha de aceptación'
      },
      next_step: {
        type: 'string',
        nullable: true,
        enum: ['waiting_cosigner_acceptance', 'loan_disbursement', null],
        example: 'loan_disbursement',
        description: 'Siguiente paso en el proceso'
      }
    }
  },

  // ==================== REJECT OFFER RESPONSE ====================

  RejectOfferResponse: {
    type: 'object',
    required: ['offer_id', 'status', 'message'],
    properties: {
      offer_id: {
        $ref: '#/components/schemas/UUID'
      },
      status: {
        type: 'string',
        enum: ['rejected'],
        example: 'rejected',
        description: 'Estado después de rechazar'
      },
      message: {
        type: 'string',
        example: 'Has rechazado la oferta.',
        description: 'Mensaje confirmatorio'
      }
    }
  }
};

module.exports = loanOfferSchemas;