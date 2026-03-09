/**
 * Paths del módulo de Préstamos (Client API)
 * Documentación OpenAPI para los 3 endpoints principales
 */

const productLoanPaths = {
  // ==================== GET /client/api/loan/capacity ====================
  '/client/api/loan/capacity': {
    get: {
      tags: ['Préstamos - Cliente'],
      summary: 'Calcula la capacidad de préstamo global del usuario',
      description: `
Calcula la capacidad de préstamo del usuario autenticado considerando:
- Validación global de seguridad (screening dangerous)
- Perfil crediticio (score, historial, alertas PEP)
- Información de ingresos
- Capacidad de pago sin codeudor
- Capacidad de pago con codeudor (si tiene ingresos)
- Lista de codeudores disponibles con sus capacidades

**Este endpoint se llama UNA SOLA VEZ al entrar al módulo de préstamos.**

**Autenticación requerida:** Sí (JWT Token)
      `,
      security: [
        {
          BearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Capacidad calculada exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  statusCode: {
                    type: 'integer',
                    example: 200
                  },
                  message: {
                    type: 'string',
                    example: 'Capacidad de préstamo calculada exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/UserLoanCapacityResponse'
                  },
                  timestamp: {
                    $ref: '#/components/schemas/Timestamp'
                  }
                }
              },
              examples: {
                success: {
                  summary: 'Usuario con ingresos y codeudor disponible',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Capacidad de préstamo calculada exitosamente',
                    data: {
                      user_id: '123e4567-e89b-12d3-a456-426614174000',
                      person_id: '223e4567-e89b-12d3-a456-426614174001',
                      calculated_at: '2024-01-17T10:30:00.000Z',
                      global_validation: {
                        is_marked_dangerous: false,
                        can_apply_any_loan: true,
                        blocking_reasons: []
                      },
                      credit_profile: {
                        has_credit_history: true,
                        credit_score: 650,
                        credit_level: 'good',
                        screening_alerts_count: 0,
                        active_loans_count: 0
                      },
                      income_info: {
                        monthly_income: 500000,
                        has_employment: true,
                        employment_count: 1
                      },
                      capacity_without_cosigner: {
                        max_debt_percentage: 35,
                        base_capacity: 175000,
                        adjustments: {
                          credit_score_penalty_pct: -10,
                          screening_penalty_pct: 0,
                          no_history_penalty_pct: 0,
                          total_penalty_pct: -10
                        },
                        adjusted_capacity: 157500,
                        final_capacity: 126000,
                        max_monthly_installment: 126000,
                        max_loan_by_income_multiplier: 1500000
                      },
                      capacity_with_cosigner: {
                        max_debt_percentage: 40,
                        base_capacity: 200000,
                        adjustments: {
                          credit_score_penalty_pct: -10,
                          screening_penalty_pct: 0,
                          no_history_penalty_pct: 0,
                          total_penalty_pct: -10
                        },
                        adjusted_capacity: 180000,
                        final_capacity: 144000,
                        max_monthly_installment: 144000,
                        max_loan_by_income_multiplier: 1500000
                      },
                      available_cosigners: [
                        {
                          debtor_cosigner_id: '323e4567-e89b-12d3-a456-426614174002',
                          cosigner_person_id: '423e4567-e89b-12d3-a456-426614174003',
                          cosigner_name: 'Juan Pérez',
                          relationship: 'father',
                          status: 'active',
                          credit_profile: {
                            has_credit_history: true,
                            credit_score: 700,
                            credit_level: 'excellent',
                            screening_alerts_count: 0,
                            active_loans_count: 0
                          },
                          capacity_as_primary: {
                            max_debt_percentage: 35,
                            base_capacity: 350000,
                            adjustments: {
                              credit_score_penalty_pct: 0,
                              screening_penalty_pct: 0,
                              no_history_penalty_pct: 0,
                              total_penalty_pct: 0
                            },
                            adjusted_capacity: 350000,
                            final_capacity: 280000,
                            max_monthly_installment: 280000,
                            max_loan_by_income_multiplier: 3000000
                          }
                        }
                      ]
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                blocked: {
                  summary: 'Usuario bloqueado por seguridad',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Capacidad de préstamo calculada exitosamente',
                    data: {
                      user_id: '123e4567-e89b-12d3-a456-426614174000',
                      person_id: '223e4567-e89b-12d3-a456-426614174001',
                      calculated_at: '2024-01-17T10:30:00.000Z',
                      global_validation: {
                        is_marked_dangerous: true,
                        can_apply_any_loan: false,
                        blocking_reasons: [
                          {
                            code: 'marked_as_dangerous',
                            message: 'Tu perfil ha sido marcado como riesgoso por nuestro sistema de seguridad',
                            severity: 'critical'
                          }
                        ]
                      },
                      credit_profile: {
                        has_credit_history: false,
                        credit_score: null,
                        credit_level: null,
                        screening_alerts_count: 0,
                        active_loans_count: 0
                      },
                      income_info: {
                        monthly_income: 0,
                        has_employment: false,
                        employment_count: 0
                      },
                      capacity_without_cosigner: {
                        max_debt_percentage: 35,
                        base_capacity: 0,
                        adjustments: {
                          credit_score_penalty_pct: -30,
                          screening_penalty_pct: 0,
                          no_history_penalty_pct: -30,
                          total_penalty_pct: -30
                        },
                        adjusted_capacity: 0,
                        final_capacity: 0,
                        max_monthly_installment: 0,
                        max_loan_by_income_multiplier: 0
                      },
                      capacity_with_cosigner: null,
                      available_cosigners: []
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        404: {
          $ref: '#/components/responses/NotFound'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  // ==================== GET /client/api/loan/products ====================
  '/client/api/loan/products': {
    get: {
      tags: ['Préstamos - Cliente'],
      summary: 'Lista productos disponibles con validación de elegibilidad',
      description: `
Lista todos los productos de préstamo activos con validación de elegibilidad para el usuario autenticado.

**Cada producto incluye:**
- Información pública del producto (límites, tasas, etc.)
- Validación de elegibilidad del usuario
- Razones de bloqueo (si no puede aplicar)
- Advertencias (si puede aplicar pero con condiciones)
- Estimación de monto máximo

**Autenticación requerida:** Sí (JWT Token)
      `,
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
            example: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Elementos por página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            example: 10
          }
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Campo para ordenar',
          required: false,
          schema: {
            type: 'string',
            default: 'created_at',
            example: 'product_name'
          }
        },
        {
          name: 'order',
          in: 'query',
          description: 'Dirección del ordenamiento',
          required: false,
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en código y nombre)',
          required: false,
          schema: {
            type: 'string',
            example: 'estudiantil'
          }
        }
      ],
      responses: {
        200: {
          description: 'Productos obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'metadata', 'timestamp'],
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  statusCode: {
                    type: 'integer',
                    example: 200
                  },
                  message: {
                    type: 'string',
                    example: 'Productos disponibles obtenidos exitosamente'
                  },
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/ProductLoanWithEligibility'
                    }
                  },
                  metadata: {
                    allOf: [
                      { $ref: '#/components/schemas/CompleteMetadata' },
                      {
                        type: 'object',
                        properties: {
                          summary: {
                            $ref: '#/components/schemas/ProductsSummary'
                          }
                        }
                      }
                    ]
                  },
                  timestamp: {
                    $ref: '#/components/schemas/Timestamp'
                  }
                }
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Productos disponibles obtenidos exitosamente',
                data: [
                  {
                    product_loan_id: '523e4567-e89b-12d3-a456-426614174005',
                    product_code: 'PRESTAMO_ESTUDIANTIL_2025',
                    product_name: 'Préstamo Estudiantil',
                    product_description: 'Préstamo exclusivo para estudiantes universitarios',
                    params_product: {
                      loan_limits: {
                        min_amount: 800000,
                        max_amount: 3000000,
                        min_term_months: 6,
                        max_term_months: 18
                      },
                      interest_and_fees: {
                        annual_percentage_rate: 18.0,
                        origination_fee_amount: 0,
                        loan_insurance_percentage: 4.5,
                        late_fee_daily_rate: 3.0,
                        legal_fee_daily_rate: 2.5,
                        collection_fee_daily_rate: 1.5
                      },
                      payment_terms: {
                        grace_period_days: 7,
                        late_threshold_days: 30,
                        collection_threshold_days: 90
                      },
                      product_info: {
                        requires_student_status: true,
                        cosigner_enabled: true
                      }
                    },
                    is_active: true,
                    created_at: '2024-01-17T10:00:00.000Z',
                    eligibility: {
                      can_apply: true,
                      blocking_reasons: [],
                      warning_reasons: [],
                      requirements_check: {
                        requires_student_status: {
                          required: true,
                          user_meets: true,
                          blocking: true
                        },
                        min_capacity_pay: {
                          required: 50000,
                          user_capacity_without_cosigner: 126000,
                          user_meets_without_cosigner: true,
                          blocking: false
                        }
                      },
                      estimated_max_loan: {
                        without_cosigner: 3000000,
                        with_cosigner: null,
                        cosigner_as_primary: null,
                        limiting_factor: 'product_limit'
                      }
                    }
                  }
                ],
                metadata: {
                  pagination: {
                    currentPage: 1,
                    pageSize: 10,
                    totalItems: 2,
                    totalPages: 1,
                    hasNextPage: false,
                    hasPreviousPage: false
                  },
                  filters: {},
                  sort: {
                    sortBy: 'created_at',
                    order: 'DESC'
                  },
                  summary: {
                    total_products: 2,
                    eligible_products: 1,
                    blocked_products: 1,
                    global_blocking_reason: null
                  }
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

  // ==================== POST /client/api/loan/applications/simulate ====================
  '/client/api/loan/applications/simulate': {
    post: {
      tags: ['Préstamos - Cliente'],
      summary: 'Simula una aplicación de préstamo',
      description: `
Simula una aplicación de préstamo con validación completa y genera la tabla de amortización.

**El sistema realiza:**
1. Validación global (screening dangerous)
2. Validación de email institucional (si es préstamo estudiantil)
3. Determinación del deudor principal (estudiante vs codeudor)
4. Cálculo de capacidad de pago
5. Validación de requisitos del producto
6. Validación de monto y plazo
7. Cálculo de cuota mensual
8. Generación de tabla de amortización
9. Cálculo de nivel de riesgo (risk_level)
10. **Guardado del intento en la BD** ✅ NUEVO
11. **Retorno del attempt_id** ✅ NUEVO

**Notas importantes:**
- Este endpoint NO crea una aplicación formal, solo simula y guarda el intento
- El \`attempt_id\` retornado puede usarse después para crear la aplicación formal
- Si \`validation_result = 'approved'\`, el usuario puede proceder a crear la aplicación
- Si \`validation_result = 'rejected_*'\`, se muestran las razones de rechazo

**Autenticación requerida:** Sí (JWT Token)
      `,
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
              $ref: '#/components/schemas/SimulateLoanApplicationRequest'
            },
            examples: {
              studentLoan: {
                summary: 'Préstamo estudiantil sin codeudor',
                value: {
                  product_code: 'PRESTAMO_ESTUDIANTIL_2025',
                  requested_amount: 1500000,
                  term_months: 12,
                  channel: 'web'
                }
              },
              studentLoanWithCosigner: {
                summary: 'Préstamo estudiantil con codeudor',
                value: {
                  product_code: 'PRESTAMO_ESTUDIANTIL_2025',
                  requested_amount: 2000000,
                  term_months: 12,
                  channel: 'web',
                  debtor_cosigner_id: '323e4567-e89b-12d3-a456-426614174002',
                  use_cosigner_as_primary: false
                }
              },
              studentLoanCosignerPrimary: {
                summary: 'Préstamo estudiantil con codeudor como principal',
                value: {
                  product_code: 'PRESTAMO_ESTUDIANTIL_2025',
                  requested_amount: 1500000,
                  term_months: 12,
                  channel: 'web',
                  debtor_cosigner_id: '323e4567-e89b-12d3-a456-426614174002',
                  use_cosigner_as_primary: true
                }
              },
              personalLoan: {
                summary: 'Préstamo personal',
                value: {
                  product_code: 'PRESTAMO_PERSONAL_2025',
                  requested_amount: 2500000,
                  term_months: 18,
                  channel: 'web'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Simulación completada exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['success', 'statusCode', 'message', 'data', 'timestamp'],
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  statusCode: {
                    type: 'integer',
                    example: 201
                  },
                  message: {
                    type: 'string',
                    example: 'Simulación de préstamo completada exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/LoanApplicationSimulationResponse'
                  },
                  timestamp: {
                    $ref: '#/components/schemas/Timestamp'
                  }
                }
              },
              examples: {
                approved: {
                  summary: 'Simulación aprobada (risk_level: low)',
                  value: {
                    success: true,
                    statusCode: 201,
                    message: 'Simulación de préstamo completada exitosamente',
                    data: {
                      attempt_id: '623e4567-e89b-12d3-a456-426614174006',
                      validation_result: 'approved',
                      risk_level: 'low',
                      user_message: '¡Felicitaciones! Tu solicitud ha sido pre-aprobada. El siguiente paso es la revisión técnica de nuestro equipo.',
                      approved_amount: 1500000,
                      term_months: 12,
                      is_cosigner_primary: false,
                      has_cosigner: false,
                      debtor_cosigner_id: null,
                      loan_details: {
                        requested_amount: 1500000,
                        approved_amount: 1500000,
                        term_months: 12,
                        annual_rate: 18.0,
                        monthly_rate: 1.5
                      },
                      fees: {
                        origination_fee_amount: 0,
                        origination_fee_per_installment: 0,
                        insurance_amount: 67500,
                        insurance_vat: 12825,
                        insurance_with_vat: 80325,
                        total_upfront_cost: 80325
                      },
                      installments: {
                        base_installment: 135000,
                        total_installment: 135000,
                        total_to_pay: 1620000,
                        total_interest: 120000,
                        total_principal: 1500000,
                        total_fees: 0
                      },
                      installment_schedule: [
                        {
                          installment_number: 1,
                          starting_balance: 1500000,
                          interest_amount: 22500,
                          principal_amount: 112500,
                          origination_fee: 0,
                          total_installment: 135000,
                          ending_balance: 1387500
                        }
                      ],
                      capacity_analysis: {
                        monthly_income: 500000,
                        max_debt_percentage: 35,
                        available_capacity: 126000,
                        required_capacity: 135000,
                        capacity_usage_percentage: 107
                      },
                      applicant_credit_score: 650,
                      rejection_reasons: [],
                      created_at: '2024-01-17T10:30:00.000Z'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                rejectedPermanently: {
                  summary: 'Rechazado permanentemente',
                  value: {
                    success: true,
                    statusCode: 201,
                    message: 'Simulación de préstamo completada exitosamente',
                    data: {
                      attempt_id: '723e4567-e89b-12d3-a456-426614174007',
                      validation_result: 'rejected_permanently',
                      risk_level: null,
                      user_message: 'Este préstamo requiere verificación de email institucional activo',
                      approved_amount: null,
                      term_months: 12,
                      is_cosigner_primary: false,
                      has_cosigner: false,
                      debtor_cosigner_id: null,
                      loan_details: null,
                      fees: null,
                      installments: null,
                      installment_schedule: [],
                      capacity_analysis: null,
                      applicant_credit_score: null,
                      rejection_reasons: ['requires_institutional_email'],
                      created_at: '2024-01-17T10:30:00.000Z'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                rejectedAdjustable: {
                  summary: 'Rechazado ajustable (puede mejorar)',
                  value: {
                    success: true,
                    statusCode: 201,
                    message: 'Simulación de préstamo completada exitosamente',
                    data: {
                      attempt_id: '823e4567-e89b-12d3-a456-426614174008',
                      validation_result: 'rejected_adjustable',
                      risk_level: null,
                      user_message: 'Tu solicitud no puede ser procesada por las siguientes razones:\n\n1. La cuota mensual supera tu capacidad de pago disponible\n2. Tu capacidad de pago no alcanza el mínimo requerido',
                      approved_amount: null,
                      term_months: 12,
                      is_cosigner_primary: false,
                      has_cosigner: false,
                      debtor_cosigner_id: null,
                      loan_details: {
                        requested_amount: 2000000,
                        approved_amount: null,
                        term_months: 12
                      },
                      fees: null,
                      installments: null,
                      installment_schedule: [],
                      capacity_analysis: {
                        monthly_income: 300000,
                        max_debt_percentage: 35,
                        available_capacity: 75600,
                        required_capacity: 180000,
                        capacity_usage_percentage: 238
                      },
                      applicant_credit_score: 350,
                      rejection_reasons: ['insufficient_capacity', 'capacity_below_minimum'],
                      created_at: '2024-01-17T10:30:00.000Z'
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        404: {
          $ref: '#/components/responses/NotFound'
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

module.exports = productLoanPaths;