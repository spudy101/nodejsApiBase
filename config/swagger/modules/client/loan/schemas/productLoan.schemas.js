/**
 * Schemas del módulo de Préstamos (Client API)
 * Incluye todos los modelos de datos para la documentación OpenAPI
 */

const productLoanSchemas = {
  // ==================== PRODUCT LOAN SCHEMAS ====================

  /**
   * Configuración pública del producto (params_product)
   */
  ProductParamsPublic: {
    type: 'object',
    required: ['loan_limits', 'interest_and_fees', 'payment_terms', 'product_info'],
    properties: {
      loan_limits: {
        type: 'object',
        required: ['min_amount', 'max_amount', 'min_term_months', 'max_term_months'],
        properties: {
          min_amount: {
            type: 'number',
            format: 'decimal',
            example: 800000,
            description: 'Monto mínimo del préstamo'
          },
          max_amount: {
            type: 'number',
            format: 'decimal',
            example: 3000000,
            description: 'Monto máximo del préstamo'
          },
          min_term_months: {
            type: 'integer',
            example: 6,
            description: 'Plazo mínimo en meses'
          },
          max_term_months: {
            type: 'integer',
            example: 18,
            description: 'Plazo máximo en meses'
          }
        }
      },
      interest_and_fees: {
        type: 'object',
        required: ['annual_percentage_rate', 'origination_fee_amount', 'loan_insurance_percentage'],
        properties: {
          annual_percentage_rate: {
            type: 'number',
            format: 'decimal',
            example: 18.0,
            description: 'Tasa de interés anual (%)'
          },
          origination_fee_amount: {
            type: 'number',
            format: 'decimal',
            example: 0,
            description: 'Comisión de originación fija'
          },
          loan_insurance_percentage: {
            type: 'number',
            format: 'decimal',
            example: 4.5,
            description: 'Porcentaje del seguro del préstamo'
          },
          late_fee_daily_rate: {
            type: 'number',
            format: 'decimal',
            example: 3.0,
            description: 'Tasa diaria por mora'
          },
          legal_fee_daily_rate: {
            type: 'number',
            format: 'decimal',
            example: 2.5,
            description: 'Tasa diaria por gestión legal'
          },
          collection_fee_daily_rate: {
            type: 'number',
            format: 'decimal',
            example: 1.5,
            description: 'Tasa diaria por cobranza'
          }
        }
      },
      payment_terms: {
        type: 'object',
        properties: {
          grace_period_days: {
            type: 'integer',
            example: 7,
            description: 'Días de gracia después del vencimiento'
          },
          late_threshold_days: {
            type: 'integer',
            example: 30,
            description: 'Días para considerar pago en mora'
          },
          collection_threshold_days: {
            type: 'integer',
            example: 90,
            description: 'Días para enviar a cobranza judicial'
          }
        }
      },
      product_info: {
        type: 'object',
        required: ['requires_student_status', 'cosigner_enabled'],
        properties: {
          requires_student_status: {
            type: 'boolean',
            example: true,
            description: 'Si requiere email institucional (préstamo estudiantil)'
          },
          cosigner_enabled: {
            type: 'boolean',
            example: true,
            description: 'Si permite agregar codeudor'
          }
        }
      }
    }
  },

  /**
   * Producto de préstamo (sin configuración privada)
   */
  ProductLoan: {
    type: 'object',
    required: ['product_loan_id', 'product_code', 'product_name', 'product_description', 'params_product', 'is_active', 'created_at'],
    properties: {
      product_loan_id: {
        $ref: '#/components/schemas/UUID'
      },
      product_code: {
        type: 'string',
        example: 'PRESTAMO_ESTUDIANTIL_2025',
        description: 'Código único del producto'
      },
      product_name: {
        type: 'string',
        example: 'Préstamo Estudiantil',
        description: 'Nombre del producto'
      },
      product_description: {
        type: 'string',
        example: 'Préstamo exclusivo para estudiantes universitarios',
        description: 'Descripción del producto'
      },
      params_product: {
        $ref: '#/components/schemas/ProductParamsPublic'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Si el producto está activo'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      }
    }
  },

  /**
   * Producto con elegibilidad
   */
  ProductLoanWithEligibility: {
    allOf: [
      { $ref: '#/components/schemas/ProductLoan' },
      {
        type: 'object',
        properties: {
          eligibility: {
            $ref: '#/components/schemas/ProductEligibility'
          }
        }
      }
    ]
  },

  /**
   * Elegibilidad del producto
   */
  ProductEligibility: {
    type: 'object',
    required: ['can_apply', 'blocking_reasons', 'warning_reasons', 'requirements_check', 'estimated_max_loan'],
    properties: {
      can_apply: {
        type: 'boolean',
        example: true,
        description: 'Si el usuario puede aplicar a este producto'
      },
      blocking_reasons: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/BlockingReason'
        },
        description: 'Razones por las que NO puede aplicar'
      },
      warning_reasons: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/WarningReason'
        },
        description: 'Advertencias (puede aplicar pero con condiciones)'
      },
      requirements_check: {
        type: 'object',
        description: 'Validación de requisitos del producto',
        additionalProperties: true
      },
      estimated_max_loan: {
        $ref: '#/components/schemas/EstimatedMaxLoan'
      }
    }
  },

  /**
   * Razón de bloqueo
   */
  BlockingReason: {
    type: 'object',
    required: ['code', 'message', 'severity'],
    properties: {
      code: {
        type: 'string',
        example: 'requires_institutional_email',
        description: 'Código del bloqueo'
      },
      message: {
        type: 'string',
        example: 'Este préstamo requiere verificación de email institucional activo',
        description: 'Mensaje descriptivo'
      },
      severity: {
        type: 'string',
        enum: ['critical'],
        example: 'critical',
        description: 'Severidad del bloqueo'
      }
    }
  },

  /**
   * Razón de advertencia
   */
  WarningReason: {
    type: 'object',
    required: ['code', 'message', 'severity'],
    properties: {
      code: {
        type: 'string',
        example: 'needs_cosigner_for_min_capacity',
        description: 'Código de advertencia'
      },
      message: {
        type: 'string',
        example: 'Necesitas agregar un codeudor para cumplir con la capacidad mínima',
        description: 'Mensaje descriptivo'
      },
      severity: {
        type: 'string',
        enum: ['warning'],
        example: 'warning',
        description: 'Severidad de la advertencia'
      }
    }
  },

  /**
   * Monto máximo estimado
   */
  EstimatedMaxLoan: {
    type: 'object',
    properties: {
      without_cosigner: {
        type: 'number',
        format: 'decimal',
        nullable: true,
        example: 3000000,
        description: 'Monto máximo sin codeudor'
      },
      with_cosigner: {
        type: 'number',
        format: 'decimal',
        nullable: true,
        example: 3000000,
        description: 'Monto máximo con codeudor'
      },
      cosigner_as_primary: {
        type: 'number',
        format: 'decimal',
        nullable: true,
        example: 3000000,
        description: 'Monto máximo con codeudor como principal'
      },
      limiting_factor: {
        type: 'string',
        example: 'product_limit',
        description: 'Factor que limita el monto'
      }
    }
  },

  // ==================== USER LOAN CAPACITY SCHEMAS ====================

  /**
   * Perfil crediticio del usuario
   */
  CreditProfile: {
    type: 'object',
    required: ['has_credit_history', 'screening_alerts_count', 'active_loans_count'],
    properties: {
      has_credit_history: {
        type: 'boolean',
        example: true,
        description: 'Si tiene historial crediticio'
      },
      credit_score: {
        type: 'integer',
        nullable: true,
        example: 650,
        description: 'Score crediticio (null si no tiene historial)'
      },
      credit_level: {
        type: 'string',
        enum: ['poor', 'fair', 'good', 'excellent'],
        nullable: true,
        example: 'good',
        description: 'Nivel de crédito'
      },
      screening_alerts_count: {
        type: 'integer',
        example: 0,
        description: 'Cantidad de alertas PEP'
      },
      active_loans_count: {
        type: 'integer',
        example: 0,
        description: 'Cantidad de préstamos activos'
      }
    }
  },

  /**
   * Información de ingresos
   */
  IncomeInfo: {
    type: 'object',
    required: ['monthly_income', 'has_employment', 'employment_count'],
    properties: {
      monthly_income: {
        type: 'number',
        format: 'decimal',
        example: 500000,
        description: 'Ingreso mensual total'
      },
      has_employment: {
        type: 'boolean',
        example: true,
        description: 'Si tiene empleos registrados'
      },
      employment_count: {
        type: 'integer',
        example: 1,
        description: 'Cantidad de empleos'
      }
    }
  },

  /**
   * Capacidad de pago
   */
  PaymentCapacity: {
    type: 'object',
    required: ['max_debt_percentage', 'base_capacity', 'adjustments', 'adjusted_capacity', 'final_capacity', 'max_monthly_installment', 'max_loan_by_income_multiplier'],
    properties: {
      max_debt_percentage: {
        type: 'number',
        format: 'decimal',
        example: 35,
        description: 'Porcentaje máximo de endeudamiento'
      },
      base_capacity: {
        type: 'number',
        format: 'decimal',
        example: 175000,
        description: 'Capacidad base antes de ajustes'
      },
      adjustments: {
        type: 'object',
        properties: {
          credit_score_penalty_pct: {
            type: 'number',
            format: 'decimal',
            example: -10,
            description: 'Penalización por score (%)'
          },
          screening_penalty_pct: {
            type: 'number',
            format: 'decimal',
            example: 0,
            description: 'Penalización por alertas (%)'
          },
          no_history_penalty_pct: {
            type: 'number',
            format: 'decimal',
            example: 0,
            description: 'Penalización por no tener historial (%)'
          },
          total_penalty_pct: {
            type: 'number',
            format: 'decimal',
            example: -10,
            description: 'Penalización total (%)'
          }
        }
      },
      adjusted_capacity: {
        type: 'number',
        format: 'decimal',
        example: 157500,
        description: 'Capacidad después de penalizaciones'
      },
      final_capacity: {
        type: 'number',
        format: 'decimal',
        example: 126000,
        description: 'Capacidad final (después de max_user_capacity_percentage)'
      },
      max_monthly_installment: {
        type: 'number',
        format: 'decimal',
        example: 126000,
        description: 'Cuota mensual máxima'
      },
      max_loan_by_income_multiplier: {
        type: 'number',
        format: 'decimal',
        example: 1500000,
        description: 'Monto máximo por multiplicador de ingreso'
      }
    }
  },

  /**
   * Validación global
   */
  GlobalValidation: {
    type: 'object',
    required: ['is_marked_dangerous', 'can_apply_any_loan', 'blocking_reasons'],
    properties: {
      is_marked_dangerous: {
        type: 'boolean',
        example: false,
        description: 'Si está marcado como peligroso'
      },
      can_apply_any_loan: {
        type: 'boolean',
        example: true,
        description: 'Si puede aplicar a algún préstamo'
      },
      blocking_reasons: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/BlockingReason'
        },
        description: 'Razones de bloqueo global'
      }
    }
  },

  /**
   * Codeudor disponible
   */
  AvailableCosigner: {
    type: 'object',
    required: ['debtor_cosigner_id', 'cosigner_person_id', 'cosigner_name', 'relationship', 'status', 'credit_profile'],
    properties: {
      debtor_cosigner_id: {
        $ref: '#/components/schemas/UUID'
      },
      cosigner_person_id: {
        $ref: '#/components/schemas/UUID'
      },
      cosigner_name: {
        type: 'string',
        example: 'Juan Pérez',
        description: 'Nombre completo del codeudor'
      },
      relationship: {
        type: 'string',
        example: 'father',
        description: 'Relación con el solicitante'
      },
      status: {
        type: 'string',
        example: 'active',
        description: 'Estado de la relación'
      },
      credit_profile: {
        $ref: '#/components/schemas/CreditProfile'
      },
      capacity_as_primary: {
        allOf: [
          { $ref: '#/components/schemas/PaymentCapacity' },
          { nullable: true }
        ],
        description: 'Capacidad del codeudor como principal'
      }
    }
  },

  /**
   * Respuesta de capacidad de préstamo
   */
  UserLoanCapacityResponse: {
    type: 'object',
    required: ['user_id', 'person_id', 'calculated_at', 'global_validation', 'credit_profile', 'income_info', 'capacity_without_cosigner', 'available_cosigners'],
    properties: {
      user_id: {
        $ref: '#/components/schemas/UUID'
      },
      person_id: {
        $ref: '#/components/schemas/UUID'
      },
      calculated_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      global_validation: {
        $ref: '#/components/schemas/GlobalValidation'
      },
      credit_profile: {
        $ref: '#/components/schemas/CreditProfile'
      },
      income_info: {
        $ref: '#/components/schemas/IncomeInfo'
      },
      capacity_without_cosigner: {
        $ref: '#/components/schemas/PaymentCapacity'
      },
      capacity_with_cosigner: {
        allOf: [
          { $ref: '#/components/schemas/PaymentCapacity' },
          { nullable: true }
        ],
        description: 'Capacidad con codeudor (null si no tiene ingresos)'
      },
      available_cosigners: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/AvailableCosigner'
        },
        description: 'Lista de codeudores disponibles'
      }
    }
  },

  // ==================== LOAN APPLICATION SIMULATION SCHEMAS ====================

  /**
   * Request de simulación
   */
  SimulateLoanApplicationRequest: {
    type: 'object',
    required: ['product_code', 'requested_amount', 'term_months', 'channel'],
    properties: {
      product_code: {
        type: 'string',
        example: 'PRESTAMO_ESTUDIANTIL_2025',
        description: 'Código del producto'
      },
      requested_amount: {
        type: 'number',
        format: 'decimal',
        minimum: 0,
        example: 1500000,
        description: 'Monto solicitado'
      },
      term_months: {
        type: 'integer',
        minimum: 1,
        example: 12,
        description: 'Plazo en meses'
      },
      channel: {
        type: 'string',
        enum: ['web', 'mobile'],
        example: 'web',
        description: 'Canal de aplicación'
      },
      debtor_cosigner_id: {
        allOf: [
          { $ref: '#/components/schemas/UUID' },
          { nullable: true }
        ],
        description: 'ID de la relación codeudor (opcional)'
      },
      use_cosigner_as_primary: {
        type: 'boolean',
        example: false,
        description: 'Si el codeudor es el principal (opcional)'
      }
    }
  },

  /**
   * Detalles del préstamo
   */
  LoanDetails: {
    type: 'object',
    required: ['requested_amount', 'approved_amount', 'term_months', 'annual_rate', 'monthly_rate'],
    properties: {
      requested_amount: {
        type: 'number',
        format: 'decimal',
        example: 1500000,
        description: 'Monto solicitado'
      },
      approved_amount: {
        type: 'number',
        format: 'decimal',
        example: 1500000,
        description: 'Monto aprobado'
      },
      term_months: {
        type: 'integer',
        example: 12,
        description: 'Plazo en meses'
      },
      annual_rate: {
        type: 'number',
        format: 'decimal',
        example: 18.0,
        description: 'Tasa anual (%)'
      },
      monthly_rate: {
        type: 'number',
        format: 'decimal',
        example: 1.5,
        description: 'Tasa mensual (%)'
      }
    }
  },

  /**
   * Fees del préstamo
   */
  LoanFees: {
    type: 'object',
    required: ['origination_fee_amount', 'origination_fee_per_installment', 'insurance_amount', 'insurance_vat', 'insurance_with_vat', 'total_upfront_cost'],
    properties: {
      origination_fee_amount: {
        type: 'number',
        format: 'decimal',
        example: 0,
        description: 'Comisión de originación total'
      },
      origination_fee_per_installment: {
        type: 'number',
        format: 'decimal',
        example: 0,
        description: 'Comisión por cuota'
      },
      insurance_amount: {
        type: 'number',
        format: 'decimal',
        example: 67500,
        description: 'Monto del seguro'
      },
      insurance_vat: {
        type: 'number',
        format: 'decimal',
        example: 12825,
        description: 'IVA del seguro'
      },
      insurance_with_vat: {
        type: 'number',
        format: 'decimal',
        example: 80325,
        description: 'Seguro con IVA'
      },
      total_upfront_cost: {
        type: 'number',
        format: 'decimal',
        example: 80325,
        description: 'Costo inicial total (se paga por adelantado)'
      }
    }
  },

  /**
   * Resumen de cuotas
   */
  InstallmentsSummary: {
    type: 'object',
    required: ['base_installment', 'total_installment', 'total_to_pay', 'total_interest', 'total_principal', 'total_fees'],
    properties: {
      base_installment: {
        type: 'number',
        format: 'decimal',
        example: 135000,
        description: 'Cuota base (sin comisión)'
      },
      total_installment: {
        type: 'number',
        format: 'decimal',
        example: 135000,
        description: 'Cuota total (con comisión)'
      },
      total_to_pay: {
        type: 'number',
        format: 'decimal',
        example: 1620000,
        description: 'Total a pagar'
      },
      total_interest: {
        type: 'number',
        format: 'decimal',
        example: 120000,
        description: 'Total de intereses'
      },
      total_principal: {
        type: 'number',
        format: 'decimal',
        example: 1500000,
        description: 'Total del principal'
      },
      total_fees: {
        type: 'number',
        format: 'decimal',
        example: 0,
        description: 'Total de comisiones'
      }
    }
  },

  /**
   * Cuota individual en tabla de amortización
   */
  InstallmentItem: {
    type: 'object',
    required: ['installment_number', 'starting_balance', 'interest_amount', 'principal_amount', 'origination_fee', 'total_installment', 'ending_balance'],
    properties: {
      installment_number: {
        type: 'integer',
        example: 1,
        description: 'Número de cuota'
      },
      starting_balance: {
        type: 'number',
        format: 'decimal',
        example: 1500000,
        description: 'Saldo inicial'
      },
      interest_amount: {
        type: 'number',
        format: 'decimal',
        example: 22500,
        description: 'Interés de la cuota'
      },
      principal_amount: {
        type: 'number',
        format: 'decimal',
        example: 112500,
        description: 'Amortización del principal'
      },
      origination_fee: {
        type: 'number',
        format: 'decimal',
        example: 0,
        description: 'Comisión de la cuota'
      },
      total_installment: {
        type: 'number',
        format: 'decimal',
        example: 135000,
        description: 'Total de la cuota'
      },
      ending_balance: {
        type: 'number',
        format: 'decimal',
        example: 1387500,
        description: 'Saldo final'
      }
    }
  },

  /**
   * Análisis de capacidad
   */
  CapacityAnalysis: {
    type: 'object',
    required: ['monthly_income', 'max_debt_percentage', 'available_capacity', 'required_capacity', 'capacity_usage_percentage'],
    properties: {
      monthly_income: {
        type: 'number',
        format: 'decimal',
        example: 500000,
        description: 'Ingreso mensual'
      },
      max_debt_percentage: {
        type: 'number',
        format: 'decimal',
        example: 35,
        description: 'Porcentaje máximo de endeudamiento'
      },
      available_capacity: {
        type: 'number',
        format: 'decimal',
        example: 126000,
        description: 'Capacidad disponible'
      },
      required_capacity: {
        type: 'number',
        format: 'decimal',
        example: 135000,
        description: 'Capacidad requerida'
      },
      capacity_usage_percentage: {
        type: 'integer',
        example: 107,
        description: 'Porcentaje de uso de capacidad'
      }
    }
  },

  /**
   * Respuesta de simulación (aprobada)
   */
  LoanApplicationSimulationResponse: {
    type: 'object',
    required: ['attempt_id', 'validation_result', 'user_message', 'term_months', 'is_cosigner_primary', 'has_cosigner', 'created_at'],
    properties: {
      attempt_id: {
        $ref: '#/components/schemas/UUID',
        description: 'ID del intento guardado en BD'
      },
      validation_result: {
        type: 'string',
        enum: ['approved', 'rejected_permanently', 'rejected_adjustable'],
        example: 'approved',
        description: 'Resultado de la validación'
      },
      risk_level: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        nullable: true,
        example: 'low',
        description: 'Nivel de riesgo (solo si aprobado)'
      },
      user_message: {
        type: 'string',
        example: '¡Felicitaciones! Tu solicitud ha sido pre-aprobada.',
        description: 'Mensaje para el usuario'
      },
      approved_amount: {
        type: 'number',
        format: 'decimal',
        nullable: true,
        example: 1500000,
        description: 'Monto aprobado (null si rechazado)'
      },
      term_months: {
        type: 'integer',
        example: 12,
        description: 'Plazo en meses'
      },
      is_cosigner_primary: {
        type: 'boolean',
        example: false,
        description: 'Si el codeudor es el principal'
      },
      has_cosigner: {
        type: 'boolean',
        example: false,
        description: 'Si tiene codeudor'
      },
      debtor_cosigner_id: {
        allOf: [
          { $ref: '#/components/schemas/UUID' },
          { nullable: true }
        ],
        description: 'ID de la relación codeudor'
      },
      loan_details: {
        allOf: [
          { $ref: '#/components/schemas/LoanDetails' },
          { nullable: true }
        ],
        description: 'Detalles del préstamo (solo si aprobado)'
      },
      fees: {
        allOf: [
          { $ref: '#/components/schemas/LoanFees' },
          { nullable: true }
        ],
        description: 'Fees del préstamo (solo si aprobado)'
      },
      installments: {
        allOf: [
          { $ref: '#/components/schemas/InstallmentsSummary' },
          { nullable: true }
        ],
        description: 'Resumen de cuotas (solo si aprobado)'
      },
      installment_schedule: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/InstallmentItem'
        },
        description: 'Tabla de amortización (solo si aprobado)'
      },
      capacity_analysis: {
        allOf: [
          { $ref: '#/components/schemas/CapacityAnalysis' },
          { nullable: true }
        ],
        description: 'Análisis de capacidad'
      },
      applicant_credit_score: {
        type: 'integer',
        nullable: true,
        example: 650,
        description: 'Score crediticio del solicitante'
      },
      rejection_reasons: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Códigos de rechazo (solo si rechazado)'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      }
    }
  },

  // ==================== LIST PRODUCTS RESPONSE ====================

  /**
   * Resumen de productos
   */
  ProductsSummary: {
    type: 'object',
    properties: {
      total_products: {
        type: 'integer',
        example: 2,
        description: 'Total de productos'
      },
      eligible_products: {
        type: 'integer',
        example: 1,
        description: 'Productos a los que puede aplicar'
      },
      blocked_products: {
        type: 'integer',
        example: 1,
        description: 'Productos bloqueados'
      },
      global_blocking_reason: {
        allOf: [
          { $ref: '#/components/schemas/BlockingReason' },
          { nullable: true }
        ],
        description: 'Razón de bloqueo global (si aplica)'
      }
    }
  }
};

module.exports = productLoanSchemas;