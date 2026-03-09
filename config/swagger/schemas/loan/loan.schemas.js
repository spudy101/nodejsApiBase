/**
 * Schemas Swagger para el módulo de préstamos
 * Cubre: Loans, Installments, Payments, RateChanges, LateCharges
 */

const loanSchemas = {

  // ==================== LOAN BASE ====================

  LoanStatus: {
    type: 'string',
    enum: ['pending_insurance', 'pending_disbursement', 'active', 'completed', 'defaulted', 'cancelled'],
    example: 'active',
    description: 'Estado del préstamo',
  },

  InstallmentState: {
    type: 'string',
    enum: ['PENDING', 'PARTIAL', 'PAID', 'ROLLED', 'WAIVED'],
    example: 'PENDING',
    description: 'Estado de la cuota',
  },

  RateChangeScheduleStatus: {
    type: 'string',
    enum: ['pending', 'approved', 'applied', 'cancelled'],
    example: 'pending',
    description: 'Estado del cambio de tasas programado',
  },

  // ==================== LOAN LIST ====================

  LoanListItem: {
    type: 'object',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      status: { $ref: '#/components/schemas/LoanStatus' },
      principal_amount: {
        type: 'number',
        format: 'float',
        example: 500000.00,
        description: 'Monto principal del préstamo',
      },
      outstanding_balance: {
        type: 'number',
        format: 'float',
        example: 350000.00,
        description: 'Saldo pendiente',
      },
      term_months: {
        type: 'integer',
        example: 12,
        description: 'Plazo en meses',
      },
      created_at: { $ref: '#/components/schemas/Timestamp' },
      disbursed_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2025-01-15T10:00:00.000Z',
      },
      educational_institution: { $ref: '#/components/schemas/EducationalInstitution' },
      first_installment_date: {
        type: 'string',
        format: 'date',
        nullable: true,
        example: '2025-02-10',
      },
      is_student_loan: {
        type: 'boolean',
        example: false,
        description: 'Indica si es un préstamo estudiantil',
      },
      product_name: {
        type: 'string',
        example: 'Préstamo Personal',
        description: 'Nombre del producto',
      },
      product_code: {
        type: 'string',
        example: 'PP-001',
        description: 'Código del producto',
      },
      debtor_person_id: {
        $ref: '#/components/schemas/UUID',
        description: 'Person ID del deudor principal',
      },
      cosigner_person_id: {
        type: 'string',
        format: 'uuid',
        nullable: true,
        description: 'Person ID del codeudor (null si no tiene)',
      },
      is_cosigner_primary: {
        type: 'boolean',
        example: false,
        description: 'True si el codeudor es el responsable primario del pago',
      },
      insurance_paid: {
        type: 'boolean',
        example: true,
        description: 'Indica si el seguro fue pagado',
      },
      completion_percentage: {
        type: 'integer',
        minimum: 0,
        maximum: 100,
        example: 33,
        description: 'Porcentaje de cuotas pagadas sobre el total',
      },
      current_installment: {
        type: 'object',
        nullable: true,
        description: 'Cuota más relevante a pagar. Null si no hay cuotas pendientes.',
        properties: {
          loan_id: { $ref: '#/components/schemas/UUID' },
          installment_number: {
            type: 'integer',
            example: 3,
            description: 'Número de la cuota',
          },
          installment_status: {
            type: 'string',
            enum: ['OVERDUE', 'GRACE_PERIOD', 'CURRENT', 'ADVANCE'],
            example: 'CURRENT',
            description: [
              'OVERDUE: cuota atrasada con mora (penalty_due > 0)',
              'GRACE_PERIOD: dentro de días de gracia (days_late > 0)',
              'CURRENT: cuota del período vigente (devengo = true)',
              'ADVANCE: cuota adelantada, no obligatoria (devengo = false)',
            ].join(' | '),
          },
          days_late: {
            type: 'integer',
            example: 0,
            description: 'Días de atraso de la cuota',
          },
          devengo: {
            type: 'boolean',
            example: true,
            description: 'True si la cuota ya está devengada (es exigible)',
          },
          due_date: {
            type: 'date',
            example: '2026-03-10',
            description: 'Fecha de pago de la cuota',
          },
          principal_due: {
            type: 'number',
            format: 'float',
            example: 35000.00,
            description: 'Capital pendiente de la cuota',
          },
          interest_due: {
            type: 'number',
            format: 'float',
            example: 8500.00,
            description: 'Intereses pendientes de la cuota',
          },
          fees_due: {
            type: 'number',
            format: 'float',
            example: 1200.00,
            description: 'Comisiones pendientes de la cuota',
          },
          penalty_due: {
            type: 'number',
            format: 'float',
            example: 0.00,
            description: 'Mora acumulada. Mayor a 0 indica cuota atrasada',
          },
          collection_due: {
            type: 'number',
            format: 'float',
            example: 0.00,
            description: 'Gastos de cobranza pendientes',
          },
          legal_due: {
            type: 'number',
            format: 'float',
            example: 0.00,
            description: 'Gastos legales pendientes',
          },
          total_due: {
            type: 'number',
            format: 'float',
            example: 44700.00,
            description: 'Total a cobrar. Suma de todos los campos _due',
          },
        },
      },
    },
  },

  LoanGlobalStatisticsResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: true },
      data: {
        type: 'object',
        properties: {
          active_loans_count: {
            type: 'integer',
            example: 3,
            description: 'Cantidad de préstamos activos (como deudor o codeudor)',
          },
          total_outstanding_balance: {
            type: 'number',
            format: 'float',
            example: 1250000.00,
            description: 'Suma total de saldos pendientes',
          },
          pending_installments_count: {
            type: 'integer',
            example: 18,
            description: 'Total de cuotas pendientes',
          },
          overdue_installments_count: {
            type: 'integer',
            example: 2,
            description: 'Total de cuotas atrasadas',
          },
          total_penalty_amount: {
            type: 'number',
            format: 'float',
            example: 15000.00,
            description: 'Monto total de mora acumulada',
          },
          next_due_date: {
            type: 'string',
            format: 'date',
            nullable: true,
            example: '2025-03-10',
            description: 'Próxima cuota a vencer',
          },
          has_overdue_installments: {
            type: 'boolean',
            example: true,
          },
          health_status: {
            type: 'string',
            enum: ['overdue', 'current', 'up_to_date'],
            example: 'overdue',
          },
        },
      },
    },
  },

  // ==================== LOAN DETAIL ====================

  LoanInsurance: {
    type: 'object',
    properties: {
      amount: { type: 'number', format: 'float', example: 15000.00 },
      with_vat: { type: 'number', format: 'float', example: 17850.00 },
      paid: { type: 'boolean', example: true },
      paid_at: { type: 'string', format: 'date-time', nullable: true, example: '2025-01-10T09:00:00.000Z' },
    },
  },

  LoanCurrentRates: {
    type: 'object',
    properties: {
      payment_terms: {
        type: 'object',
        properties: {
          grace_period_days: { type: 'integer', example: 5 },
          late_threshold_days: { type: 'integer', example: 30 },
          collection_threshold_days: { type: 'integer', example: 60 },
        },
      },
      interest_and_fees: {
        type: 'object',
        properties: {
          annual_percentage_rate: { type: 'number', example: 24.5 },
          origination_fee_amount: { type: 'number', example: 25000.00 },
          late_fee_daily_rate: { type: 'number', example: 0.03 },
          collection_fee_daily_rate: { type: 'number', example: 0.015 },
          legal_fee_daily_rate: { type: 'number', example: 0.025 },
        },
      },
      vat_percentage: { type: 'number', example: 19.0 },
    },
  },

  LoanParticipant: {
    type: 'object',
    properties: {
      person_id: { $ref: '#/components/schemas/UUID' },
      first_name: { type: 'string', example: 'Juan' },
      last_name: { type: 'string', example: 'Pérez' },
      email: { type: 'string', format: 'email', example: 'juan@example.com' },
      phone: { type: 'string', example: '+56912345678', nullable: true },
    },
  },

  InstallmentsSummary: {
    type: 'object',
    properties: {
      total_installments: { type: 'integer', example: 12 },
      paid_installments: { type: 'integer', example: 4 },
      pending_installments: { type: 'integer', example: 8 },
      overdue_installments: { type: 'integer', example: 1 },
      completion_percentage: { type: 'integer', example: 33 },
      next_due_date: { type: 'string', format: 'date', nullable: true, example: '2025-03-10' },
    },
  },

  LoanDetail: {
    type: 'object',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      status: { $ref: '#/components/schemas/LoanStatus' },
      principal_amount: { type: 'number', format: 'float', example: 500000.00 },
      outstanding_balance: { type: 'number', format: 'float', example: 350000.00 },
      term_months: { type: 'integer', example: 12 },
      is_student_loan: { type: 'boolean', example: false },
      disbursement_method: { type: 'string', example: 'bank_transfer', nullable: true },
      created_at: { $ref: '#/components/schemas/Timestamp' },
      insurance_paid_at: { type: 'string', format: 'date-time', nullable: true, example: '2025-01-10T09:00:00.000Z' },
      disbursed_at: { type: 'string', format: 'date-time', nullable: true, example: '2025-01-15T10:00:00.000Z' },
      first_installment_date: { type: 'string', format: 'date', nullable: true, example: '2025-02-10' },
      last_installment_date: { type: 'string', format: 'date', nullable: true, example: '2026-01-10' },
      completed_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      insurance: { $ref: '#/components/schemas/LoanInsurance' },
      current_rates: { $ref: '#/components/schemas/LoanCurrentRates' },
      debtor: { $ref: '#/components/schemas/LoanParticipant' },
      educational_institution: { $ref: '#/components/schemas/EducationalInstitution' },
      product: {
        type: 'object',
        properties: {
          product_id: { $ref: '#/components/schemas/UUID' },
          product_name: { type: 'string', example: 'Préstamo Personal' },
          product_code: { type: 'string', example: 'PP-001' },
        },
      },
      installments_summary: { $ref: '#/components/schemas/InstallmentsSummary' },
    },
  },

  LoanAdminDetail: {
    allOf: [
      { $ref: '#/components/schemas/LoanDetail' },
      {
        type: 'object',
        properties: {
          disbursement_info: {
            type: 'object',
            nullable: true,
            properties: {
              disbursement_id: { $ref: '#/components/schemas/UUID' },
              amount: { type: 'number', format: 'float', example: 500000.00 },
              method: { type: 'string', example: 'bank_transfer' },
              disbursed_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:00:00.000Z' },
              disbursed_by: { $ref: '#/components/schemas/UUID' },
              account: { type: 'string', example: '0123456789', nullable: true },
              account_holder: { type: 'string', example: 'Juan Pérez', nullable: true },
              bank_name: { type: 'string', example: 'Banco Estado', nullable: true },
              notes: { type: 'string', nullable: true, example: 'Desembolso aprobado por administrador' },
            },
          },
          technical_info: {
            type: 'object',
            properties: {
              offer_id: { $ref: '#/components/schemas/UUID' },
              product_loan_id: { $ref: '#/components/schemas/UUID' },
              channel: { type: 'string', example: 'web', nullable: true },
              ip_address: { type: 'string', example: '192.168.1.1', nullable: true },
            },
          },
          student_email: {
            type: 'string',
            format: 'email',
            nullable: true,
            example: 'juan.perez@uchile.cl',
            description: 'Email estudiantil vigente al momento del desembolso manual',
          },
          disbursement_metadata: {
            type: 'object',
            nullable: true,
            additionalProperties: true,
            description: 'Para desembolsos automáticos incluye account_id, previous_balance y new_balance',
            example: {
              account_id: '550e8400-e29b-41d4-a716-446655440000',
              previous_balance: 100000.00,
              new_balance: 600000.00,
            },
          },
        },
      },
    ],
  },

  // ==================== INSTALLMENTS ====================

  RateSnapshot: {
    type: 'object',
    description: 'Snapshot de tasas vigentes al momento de creación de la cuota',
    properties: {
      apr: { type: 'number', example: 24.5, description: 'Tasa anual efectiva (%)' },
      grace_period_days: { type: 'integer', example: 5 },
      late_threshold_days: { type: 'integer', example: 30 },
      collection_threshold_days: { type: 'integer', example: 60 },
      penalty_rate: { type: 'number', example: 0.03, description: 'Tasa diaria de mora (%)' },
      collection_rate: { type: 'number', example: 0.015, description: 'Tasa diaria de cobranza (%)' },
      legal_rate: { type: 'number', example: 0.025, description: 'Tasa diaria legal (%)' },
      origination_fee_amount: { type: 'number', example: 25000.00 },
    },
  },

  InstallmentListItem: {
    type: 'object',
    properties: {
      installment_number: { type: 'integer', example: 3 },
      due_date: { $ref: '#/components/schemas/Date' },
      state: { $ref: '#/components/schemas/InstallmentState' },
      days_late: { type: 'integer', example: 0 },
      paid_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      principal_due: { type: 'number', format: 'float', example: 38500.00 },
      interest_due: { type: 'number', format: 'float', example: 9800.00 },
      fees_due: { type: 'number', format: 'float', example: 2083.33 },
      penalty_due: { type: 'number', format: 'float', example: 0.00 },
      collection_due: { type: 'number', format: 'float', example: 0.00 },
      legal_due: { type: 'number', format: 'float', example: 0.00 },
      total_amount_due: { type: 'number', format: 'float', example: 50383.33 },
      is_overdue: { type: 'boolean', example: false },
      is_in_grace_period: { type: 'boolean', example: false },
    },
  },

  PenaltyBreakdown: {
    type: 'object',
    properties: {
      days_late: { type: 'integer', example: 15 },
      grace_period_days: { type: 'integer', example: 5 },
      is_in_grace: { type: 'boolean', example: false },
      is_in_late: { type: 'boolean', example: true },
      is_in_collection: { type: 'boolean', example: false },
      is_in_legal: { type: 'boolean', example: false },
      penalty_rate: { type: 'number', example: 0.03 },
      collection_rate: { type: 'number', example: 0.015 },
      legal_rate: { type: 'number', example: 0.025 },
    },
  },

  InstallmentDetail: {
    allOf: [
      { $ref: '#/components/schemas/InstallmentListItem' },
      {
        type: 'object',
        properties: {
          rate_snapshot: { $ref: '#/components/schemas/RateSnapshot' },
          starting_balance: { type: 'number', format: 'float', example: 500000.00 },
          ending_balance: { type: 'number', format: 'float', example: 461500.00 },
          devengo: { type: 'boolean', example: false },
          penalty_breakdown: {
            $ref: '#/components/schemas/PenaltyBreakdown',
            nullable: true,
          },
        },
      },
    ],
  },

  // ==================== PAYMENTS ====================

  PaymentListItem: {
    type: 'object',
    properties: {
      payment_id: { $ref: '#/components/schemas/UUID' },
      payment_type: {
        type: 'string',
        enum: ['insurance', 'installment'],
        example: 'installment',
      },
      payment_method: { $ref: '#/components/schemas/PaymentMethod' },
      installment_number: { type: 'integer', nullable: true, example: 3 },
      amount: { type: 'number', format: 'float', example: 50383.33 },
      amount_paid: { type: 'number', format: 'float', nullable: true, example: 50383.33 },
      status: {
        type: 'string',
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'failed'],
        example: 'approved',
      },
      initiated_at: { $ref: '#/components/schemas/Timestamp' },
      paid_at: { type: 'string', format: 'date-time', nullable: true, example: '2025-02-10T14:22:00.000Z' },
      mp_payment_id: { type: 'string', nullable: true, example: '1234567890' },
      external_reference: { type: 'string', nullable: true, example: 'loan_abc123_installment_3' },
      error_message: {
        type: 'string',
        nullable: true,
        example: 'insufficient_balance',
        description: 'Motivo del fallo. Para account_balance: insufficient_balance',
      },
    },
  },

  InitiateInsurancePaymentResponse: {
    type: 'object',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      payment_id: { $ref: '#/components/schemas/UUID' },
      payment_type: { type: 'string', example: 'insurance' },
      payment_method: { type: 'string', example: 'mercadopago' },
      amount: { type: 'number', format: 'float', example: 17850.00 },
      external_reference: { type: 'string', example: 'loan_abc123_insurance' },
      mp_preference_id: { type: 'string', example: '1063871469-5d2e0e10-9a4a-4c0d-9d89-7f1e26b4a2c1' },
      init_point: {
        type: 'string',
        format: 'uri',
        example: 'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=1063871469-5d2e',
        description: 'URL de redirección a MercadoPago',
      },
      message: { type: 'string', example: 'Pago de seguro iniciado. Redirige al usuario al init_point.' },
    },
  },

  InitiateInstallmentPaymentResponse: {
    type: 'object',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      payment_id: { $ref: '#/components/schemas/UUID' },
      payment_type: { type: 'string', example: 'installment' },
      payment_method: { type: 'string', example: 'mercadopago' },
      installment_number: { type: 'integer', example: 3 },
      amount: { type: 'number', format: 'float', example: 50383.33 },
      external_reference: { type: 'string', example: 'loan_abc123_installment_3' },
      mp_preference_id: { type: 'string', example: '1063871469-5d2e0e10-9a4a-4c0d-9d89-7f1e26b4a2c1' },
      init_point: {
        type: 'string',
        format: 'uri',
        example: 'https://www.mercadopago.cl/checkout/v1/redirect?pref_id=1063871469-5d2e',
        description: 'URL de redirección a MercadoPago',
      },
      message: { type: 'string', example: 'Pago de cuota #3 iniciado. Redirige al usuario al init_point.' },
    },
  },

  // ==================== STATISTICS ====================

  LoanStatistics: {
    type: 'object',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      total_installments: { type: 'integer', example: 12 },
      paid_installments: { type: 'integer', example: 4 },
      pending_installments: { type: 'integer', example: 8 },
      overdue_installments: { type: 'integer', example: 1 },
      total_principal: { type: 'number', format: 'float', example: 500000.00 },
      paid_principal: { type: 'number', format: 'float', example: 154000.00 },
      pending_principal: { type: 'number', format: 'float', example: 346000.00 },
      total_penalties: { type: 'number', format: 'float', example: 3250.00 },
      completion_percentage: { type: 'integer', example: 33 },
    },
  },

  // ==================== RATE CHANGES ====================

  NewRatesBody: {
    type: 'object',
    description: 'Nuevas tasas a aplicar al préstamo',
    properties: {
      annual_percentage_rate: { type: 'number', minimum: 0, maximum: 100, example: 22.0 },
      origination_fee_amount: { type: 'number', minimum: 0, example: 20000.00 },
      late_fee_daily_rate: { type: 'number', minimum: 0, example: 0.025 },
      collection_fee_daily_rate: { type: 'number', minimum: 0, example: 0.012 },
      legal_fee_daily_rate: { type: 'number', minimum: 0, example: 0.02 },
      payment_terms: {
        type: 'object',
        properties: {
          grace_period_days: { type: 'integer', minimum: 0, example: 7 },
          late_threshold_days: { type: 'integer', minimum: 0, example: 30 },
          collection_threshold_days: { type: 'integer', minimum: 0, example: 60 },
        },
      },
    },
  },

  ScheduleRateChangeResponse: {
    type: 'object',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      schedule_id: { $ref: '#/components/schemas/UUID' },
      change_request_id: { $ref: '#/components/schemas/UUID' },
      scheduled_for: { type: 'string', format: 'date-time', example: '2025-03-10T09:00:00.000Z' },
      status: { type: 'string', example: 'pending_approval' },
      message: { type: 'string', example: 'Cambio de tasas programado. Requiere aprobación de otro administrador.' },
    },
  },

  RateChangeScheduleItem: {
    type: 'object',
    properties: {
      schedule_id: { $ref: '#/components/schemas/UUID' },
      loan_id: { $ref: '#/components/schemas/UUID' },
      scheduled_for: { type: 'string', format: 'date-time', example: '2025-03-10T09:00:00.000Z' },
      status: { $ref: '#/components/schemas/RateChangeScheduleStatus' },
      change_description: { type: 'string', example: 'Reducción de tasa por buen comportamiento' },
      previous_values: { type: 'object', additionalProperties: true },
      new_values: { type: 'object', additionalProperties: true },
      scheduled_by: {
        type: 'object',
        nullable: true,
        properties: {
          user_id: { $ref: '#/components/schemas/UUID' },
          email: { $ref: '#/components/schemas/Email' },
          name: { type: 'string', example: 'Ana García', nullable: true },
        },
      },
      applied_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      cancelled_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      can_be_cancelled: { type: 'boolean', example: true },
    },
  },

  ApproveRateChangeResponse: {
    type: 'object',
    properties: {
      change_request_id: { $ref: '#/components/schemas/UUID' },
      status: { type: 'string', example: 'approved' },
      message: { type: 'string', example: 'Cambio de tasas aprobado. Se aplicará el día 10 del próximo mes.' },
    },
  },

  CancelRateChangeResponse: {
    type: 'object',
    properties: {
      schedule_id: { $ref: '#/components/schemas/UUID' },
      status: { type: 'string', example: 'cancelled' },
      message: { type: 'string', example: 'Cambio de tasas cancelado exitosamente.' },
    },
  },

  CancelChangeRequestResponse: {
    type: 'object',
    properties: {
      change_request_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID de la solicitud de cambio cancelada',
      },
      status: {
        type: 'string',
        example: 'cancelled',
        description: 'Estado resultante de la solicitud',
      },
      message: {
        type: 'string',
        example: 'Solicitud de cambio de tasas cancelada exitosamente.',
      },
    },
  },

  // ==================== LATE CHARGES (MORA) ====================

  LateChargeDayItem: {
    type: 'object',
    description: 'Cobro de mora de un día específico',
    properties: {
      late_charge_id: { $ref: '#/components/schemas/UUID' },
      installment_number: { type: 'integer', example: 2 },
      charged_date: { $ref: '#/components/schemas/Date' },
      days_late: { type: 'integer', example: 12 },
      penalty_charged: { type: 'number', format: 'float', example: 1500.00, description: 'Mora cobrada ese día' },
      collection_charged: { type: 'number', format: 'float', example: 0.00, description: 'Cobranza cobrada ese día' },
      legal_charged: { type: 'number', format: 'float', example: 0.00, description: 'Legal cobrado ese día' },
      total_charged: { type: 'number', format: 'float', example: 1500.00, description: 'Total cobrado ese día' },
    },
  },

  LateChargeDayAdminItem: {
    allOf: [
      { $ref: '#/components/schemas/LateChargeDayItem' },
      {
        type: 'object',
        properties: {
          rate_snapshot_used: {
            $ref: '#/components/schemas/RateSnapshot',
            description: 'Tasas usadas para calcular este cobro (solo admin)',
          },
        },
      },
    ],
  },

  LateChargeInstallmentSummary: {
    type: 'object',
    description: 'Resumen de mora acumulada para una cuota específica',
    properties: {
      installment_number: { type: 'integer', example: 2 },
      total_charge_days: { type: 'integer', example: 18, description: 'Días que se cobró mora' },
      max_days_late: { type: 'integer', example: 18, description: 'Máximo de días de atraso registrado' },
      first_charge_date: { $ref: '#/components/schemas/Date' },
      last_charge_date: { $ref: '#/components/schemas/Date' },
      total_penalty: { type: 'number', format: 'float', example: 27000.00 },
      total_collection: { type: 'number', format: 'float', example: 8100.00 },
      total_legal: { type: 'number', format: 'float', example: 0.00 },
      grand_total: { type: 'number', format: 'float', example: 35100.00 },
    },
  },

  LateChargeTotals: {
    type: 'object',
    description: 'Totales acumulados de mora de todo el préstamo',
    properties: {
      total_penalty: { type: 'number', format: 'float', example: 27000.00 },
      total_collection: { type: 'number', format: 'float', example: 8100.00 },
      total_legal: { type: 'number', format: 'float', example: 0.00 },
      grand_total: { type: 'number', format: 'float', example: 35100.00 },
      total_charge_days: { type: 'integer', example: 18 },
    },
  },

  LoanLateChargeHistory: {
    type: 'object',
    description: 'Resumen de mora del préstamo agrupado por cuota',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      totals: { $ref: '#/components/schemas/LateChargeTotals' },
      installments_summary: {
        type: 'array',
        items: { $ref: '#/components/schemas/LateChargeInstallmentSummary' },
      },
    },
  },

  LoanLateChargeDailyList: {
    type: 'object',
    description: 'Historial diario de cobros de mora (versión cliente)',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      charges: {
        type: 'array',
        items: { $ref: '#/components/schemas/LateChargeDayItem' },
      },
    },
  },

  LoanLateChargeDailyListAdmin: {
    type: 'object',
    description: 'Historial diario de cobros de mora (versión admin, incluye rate_snapshot_used)',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      charges: {
        type: 'array',
        items: { $ref: '#/components/schemas/LateChargeDayAdminItem' },
      },
    },
  },

  // ==================== DISBURSE ====================

  DisburseLoanBody: {
    type: 'object',
    properties: {
      account: { type: 'string', example: '0123456789', description: 'Número de cuenta bancaria' },
      account_holder: { type: 'string', example: 'Juan Pérez', description: 'Titular de la cuenta' },
      bank_name: { type: 'string', example: 'Banco Estado', description: 'Nombre del banco' },
      notes: { type: 'string', example: 'Desembolso aprobado manualmente', description: 'Notas adicionales' },
    },
  },

  DisburseLoanResponse: {
    type: 'object',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      status: { $ref: '#/components/schemas/LoanStatus' },
      disbursed_at: { type: 'string', format: 'date-time', example: '2025-01-15T10:00:00.000Z' },
      student_email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'juan.perez@uchile.cl',
        description: 'Email estudiantil al que se asoció el desembolso. Null si no había email activo.',
      },
      message: { type: 'string', example: 'Préstamo desembolsado exitosamente' },
    },
  },

  PaymentMethod: {
    type: 'string',
    enum: ['mercadopago', 'account_balance'],
    example: 'mercadopago',
    description: 'mercadopago: redirige al checkout | account_balance: descuento inmediato del saldo',
  },

  PayWithBalanceResponse: {
    type: 'object',
    description: 'Respuesta al pagar seguro o cuota con saldo de cuenta. El pago es inmediato, no hay redirección.',
    properties: {
      loan_id: { $ref: '#/components/schemas/UUID' },
      payment_id: { $ref: '#/components/schemas/UUID' },
      payment_type: {
        type: 'string',
        enum: ['insurance', 'installment'],
        example: 'installment',
      },
      payment_method: { type: 'string', example: 'account_balance' },
      amount_paid: { type: 'number', format: 'float', example: 50383.33 },
      loan_status: { $ref: '#/components/schemas/LoanStatus' },
      installment_number: {
        type: 'integer',
        nullable: true,
        example: 3,
        description: 'Solo presente en pagos de tipo installment',
      },
    },
  },

  EducationalInstitution: {
    type: 'object',
    nullable: true,
    description: 'Institución educativa asociada. Null para préstamos no estudiantiles.',
    properties: {
      institution_id: { $ref: '#/components/schemas/UUID' },
      name: { type: 'string', example: 'Universidad de Chile', nullable: true },
      has_agreement: { type: 'boolean', nullable: true, example: true },
    },
  },

};

module.exports = loanSchemas;
