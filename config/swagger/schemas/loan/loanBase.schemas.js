/**
 * Schemas base reutilizables para Loan Application Review y Loan Offer
 * Corresponden a los DTOs en loanBase.dto.js
 */

const loanBaseSchemas = {
  // ==================== LOAN FINANCIAL DETAILS ====================

  LoanFinancialDetails: {
    type: 'object',
    required: ['requested_amount', 'term_months', 'interest_and_fees', 'payment_terms', 'vat_percentage'],
    properties: {
      requested_amount: {
        type: 'number',
        format: 'float',
        example: 5000000,
        description: 'Monto solicitado del préstamo'
      },
      approved_amount: {
        type: 'number',
        format: 'float',
        nullable: true,
        example: 4500000,
        description: 'Monto aprobado del préstamo'
      },
      term_months: {
        type: 'integer',
        example: 12,
        description: 'Plazo en meses'
      },
      interest_and_fees: {
        type: 'object',
        description: 'Tasas de interés y comisiones',
        properties: {
          annual_percentage_rate: {
            type: 'number',
            format: 'float',
            example: 18.5,
            description: 'Tasa de interés anual (%)'
          },
          origination_fee_amount: {
            type: 'number',
            format: 'float',
            example: 150000,
            description: 'Monto de comisión de originación'
          },
          loan_insurance_percentage: {
            type: 'number',
            format: 'float',
            example: 2.5,
            description: 'Porcentaje de seguro de desgravamen (%)'
          }
        }
      },
      payment_terms: {
        type: 'object',
        description: 'Términos de pago',
        properties: {
          payment_frequency: {
            type: 'string',
            example: 'monthly',
            description: 'Frecuencia de pago'
          },
          first_payment_days: {
            type: 'integer',
            example: 30,
            description: 'Días hasta el primer pago'
          }
        }
      },
      vat_percentage: {
        type: 'number',
        format: 'float',
        example: 19,
        description: 'Porcentaje de IVA (%)'
      },
      calculation_details: {
        type: 'object',
        nullable: true,
        description: 'Detalles de cálculos financieros',
        properties: {
          installments: {
            type: 'object',
            properties: {
              total_installment: {
                type: 'number',
                format: 'float',
                example: 456789.50,
                description: 'Cuota mensual total'
              },
              total_to_pay: {
                type: 'number',
                format: 'float',
                example: 5481474,
                description: 'Total a pagar durante el préstamo'
              },
              principal_installment: {
                type: 'number',
                format: 'float',
                example: 375000,
                description: 'Cuota de capital'
              },
              interest_installment: {
                type: 'number',
                format: 'float',
                example: 69375,
                description: 'Cuota de interés'
              },
              insurance_installment: {
                type: 'number',
                format: 'float',
                example: 12414.50,
                description: 'Cuota de seguro'
              }
            }
          },
          total_interest: {
            type: 'number',
            format: 'float',
            example: 832500,
            description: 'Total de intereses a pagar'
          },
          total_insurance: {
            type: 'number',
            format: 'float',
            example: 148974,
            description: 'Total de seguro a pagar'
          }
        }
      },
      installment_schedule: {
        type: 'array',
        nullable: true,
        description: 'Calendario de cuotas',
        items: {
          type: 'object',
          properties: {
            installment_number: {
              type: 'integer',
              example: 1,
              description: 'Número de cuota'
            },
            due_date: {
              type: 'string',
              format: 'date',
              example: '2024-02-17',
              description: 'Fecha de vencimiento'
            },
            principal: {
              type: 'number',
              format: 'float',
              example: 375000,
              description: 'Capital de la cuota'
            },
            interest: {
              type: 'number',
              format: 'float',
              example: 69375,
              description: 'Interés de la cuota'
            },
            insurance: {
              type: 'number',
              format: 'float',
              example: 12414.50,
              description: 'Seguro de la cuota'
            },
            total: {
              type: 'number',
              format: 'float',
              example: 456789.50,
              description: 'Total de la cuota'
            },
            balance: {
              type: 'number',
              format: 'float',
              example: 4625000,
              description: 'Saldo restante después de la cuota'
            }
          }
        }
      },
      monthly_installment: {
        type: 'number',
        format: 'float',
        example: 456789.50,
        description: 'Cuota mensual (shortcut desde calculation_details)'
      },
      total_to_pay: {
        type: 'number',
        format: 'float',
        example: 5481474,
        description: 'Total a pagar (shortcut desde calculation_details)'
      }
    }
  },

  // ==================== LOAN PARTICIPANT ====================

  LoanParticipant: {
    type: 'object',
    required: ['person_id', 'full_name', 'first_name', 'last_name', 'type'],
    properties: {
      person_id: {
        $ref: '#/components/schemas/UUID'
      },
      full_name: {
        type: 'string',
        example: 'Juan Pérez',
        description: 'Nombre completo del participante'
      },
      first_name: {
        type: 'string',
        example: 'Juan',
        description: 'Primer nombre'
      },
      last_name: {
        type: 'string',
        example: 'Pérez',
        description: 'Apellido'
      },
      type: {
        type: 'string',
        enum: ['applicant', 'cosigner'],
        example: 'applicant',
        description: 'Tipo de participante'
      },
      email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'juan.perez@example.com',
        description: 'Email de contacto'
      },
      phone: {
        type: 'string',
        nullable: true,
        example: '+56912345678',
        description: 'Teléfono de contacto'
      }
    }
  },

  // ==================== LOAN PRODUCT ====================

  LoanProduct: {
    type: 'object',
    required: ['product_loan_id', 'product_code', 'product_name'],
    properties: {
      product_loan_id: {
        $ref: '#/components/schemas/UUID'
      },
      product_code: {
        type: 'string',
        example: 'CONSUMER_LOAN_V1',
        description: 'Código del producto'
      },
      product_name: {
        type: 'string',
        example: 'Préstamo de Consumo',
        description: 'Nombre del producto'
      },
      product_description: {
        type: 'string',
        nullable: true,
        example: 'Préstamo personal para consumo general',
        description: 'Descripción del producto'
      },
      version: {
        type: 'integer',
        nullable: true,
        example: 1,
        description: 'Versión del producto'
      },
      params_product: {
        type: 'object',
        nullable: true,
        description: 'Parámetros del producto',
        properties: {
          loan_limits: {
            type: 'object',
            properties: {
              min_amount: {
                type: 'number',
                format: 'float',
                example: 100000,
                description: 'Monto mínimo'
              },
              max_amount: {
                type: 'number',
                format: 'float',
                example: 10000000,
                description: 'Monto máximo'
              },
              min_term_months: {
                type: 'integer',
                example: 6,
                description: 'Plazo mínimo en meses'
              },
              max_term_months: {
                type: 'integer',
                example: 60,
                description: 'Plazo máximo en meses'
              }
            }
          },
          interest_and_fees: {
            type: 'object',
            description: 'Tasas y comisiones del producto'
          },
          payment_terms: {
            type: 'object',
            description: 'Términos de pago del producto'
          }
        }
      }
    }
  },

  // ==================== CREDIT CAPACITY ANALYSIS ====================

  CreditCapacityAnalysis: {
    type: 'object',
    properties: {
      applicant_credit_score: {
        type: 'number',
        format: 'float',
        nullable: true,
        example: 750,
        description: 'Score crediticio del aplicante'
      },
      applicant_adjusted_score: {
        type: 'number',
        format: 'float',
        nullable: true,
        example: 725,
        description: 'Score ajustado del aplicante'
      },
      cosigner_credit_score: {
        type: 'number',
        format: 'float',
        nullable: true,
        example: 800,
        description: 'Score crediticio del codeudor'
      },
      cosigner_adjusted_score: {
        type: 'number',
        format: 'float',
        nullable: true,
        example: 780,
        description: 'Score ajustado del codeudor'
      },
      applicant_capacity: {
        type: 'object',
        nullable: true,
        description: 'Análisis de capacidad del aplicante',
        properties: {
          credit_score: {
            type: 'number',
            format: 'float',
            example: 750
          },
          income_analysis: {
            type: 'object',
            properties: {
              monthly_income: {
                type: 'number',
                format: 'float',
                example: 2000000,
                description: 'Ingreso mensual'
              },
              debt_ratio: {
                type: 'number',
                format: 'float',
                example: 35.5,
                description: 'Ratio de endeudamiento (%)'
              }
            }
          },
          adjusted_capacity: {
            type: 'number',
            format: 'float',
            example: 725,
            description: 'Capacidad ajustada'
          }
        }
      },
      cosigner_capacity: {
        type: 'object',
        nullable: true,
        description: 'Análisis de capacidad del codeudor',
        properties: {
          credit_score: {
            type: 'number',
            format: 'float',
            example: 800
          },
          income_analysis: {
            type: 'object',
            properties: {
              monthly_income: {
                type: 'number',
                format: 'float',
                example: 2500000
              },
              debt_ratio: {
                type: 'number',
                format: 'float',
                example: 28.3
              }
            }
          },
          adjusted_capacity: {
            type: 'number',
            format: 'float',
            example: 780
          }
        }
      },
      risk_level: {
        type: 'string',
        nullable: true,
        enum: ['low', 'medium', 'high'],
        example: 'medium',
        description: 'Nivel de riesgo evaluado'
      }
    }
  },

  // ==================== COSIGNER INFO ====================

  CosignerInfo: {
    type: 'object',
    properties: {
      has_cosigner: {
        type: 'boolean',
        example: true,
        description: 'Indica si tiene codeudor'
      },
      debtor_cosigner_id: {
        $ref: '#/components/schemas/UUID'
      },
      is_primary: {
        type: 'boolean',
        example: false,
        description: 'Indica si el codeudor es primario'
      },
      accepted: {
        type: 'boolean',
        example: true,
        description: 'Indica si el codeudor aceptó'
      },
      accepted_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de aceptación del codeudor'
      },
      rejected_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null,
        description: 'Fecha de rechazo del codeudor'
      },
      participant: {
        $ref: '#/components/schemas/LoanParticipant'
      }
    }
  },

  // ==================== ACCEPTANCE STATUS ====================

  AcceptanceStatus: {
    type: 'object',
    required: [
      'applicant_accepted',
      'cosigner_accepted',
      'is_expired',
      'can_applicant_accept',
      'can_cosigner_accept'
    ],
    properties: {
      applicant_accepted: {
        type: 'boolean',
        example: true,
        description: 'Indica si el aplicante aceptó'
      },
      applicant_accepted_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de aceptación del aplicante'
      },
      applicant_rejected_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null,
        description: 'Fecha de rechazo del aplicante'
      },
      cosigner_accepted: {
        type: 'boolean',
        example: false,
        description: 'Indica si el codeudor aceptó'
      },
      cosigner_accepted_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null,
        description: 'Fecha de aceptación del codeudor'
      },
      cosigner_rejected_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null,
        description: 'Fecha de rechazo del codeudor'
      },
      is_expired: {
        type: 'boolean',
        example: false,
        description: 'Indica si la oferta expiró'
      },
      can_applicant_accept: {
        type: 'boolean',
        example: true,
        description: 'Indica si el aplicante puede aceptar actualmente'
      },
      can_cosigner_accept: {
        type: 'boolean',
        example: false,
        description: 'Indica si el codeudor puede aceptar actualmente'
      }
    }
  }
};

module.exports = loanBaseSchemas;