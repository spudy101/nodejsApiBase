/**
 * Product Loan Swagger Schemas
 * Esquemas para la documentación de API de productos de préstamo
 */

const productLoanSchemas = {
  // ==================== PARAMS PRODUCT ====================
  
  LoanLimits: {
    type: 'object',
    required: ['min_amount', 'max_amount', 'min_term_months', 'max_term_months'],
    properties: {
      min_amount: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 1200000,
        description: 'Monto mínimo del préstamo en CLP'
      },
      max_amount: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 4000000,
        description: 'Monto máximo del préstamo en CLP'
      },
      min_term_months: {
        type: 'integer',
        minimum: 1,
        maximum: 120,
        example: 6,
        description: 'Plazo mínimo en meses'
      },
      max_term_months: {
        type: 'integer',
        minimum: 1,
        maximum: 120,
        example: 24,
        description: 'Plazo máximo en meses'
      }
    }
  },

  InterestAndFees: {
    type: 'object',
    required: [
      'annual_percentage_rate',
      'origination_fee_amount',
      'loan_insurance_percentage',
      'late_fee_daily_rate',
      'legal_fee_daily_rate',
      'collection_fee_daily_rate'
    ],
    properties: {
      annual_percentage_rate: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 100,
        example: 25.0,
        description: 'Tasa de interés anual (%)'
      },
      origination_fee_amount: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 15000,
        description: 'Comisión fija de apertura (monto en CLP)'
      },
      loan_insurance_percentage: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 100,
        example: 5.7,
        description: 'Porcentaje de seguro del préstamo (%)'
      },
      late_fee_daily_rate: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 5.0,
        description: 'Tasa diaria de mora (%)'
      },
      legal_fee_daily_rate: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 4.0,
        description: 'Tasa diaria de honorarios legales (%)'
      },
      collection_fee_daily_rate: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 2.0,
        description: 'Tasa diaria de cobranza (%)'
      }
    }
  },

  PaymentTerms: {
    type: 'object',
    required: ['grace_period_days', 'late_threshold_days', 'collection_threshold_days'],
    properties: {
      grace_period_days: {
        type: 'integer',
        minimum: 0,
        example: 5,
        description: 'Días de gracia para pago'
      },
      late_threshold_days: {
        type: 'integer',
        minimum: 0,
        example: 20,
        description: 'Días antes de considerar mora'
      },
      collection_threshold_days: {
        type: 'integer',
        minimum: 0,
        example: 60,
        description: 'Días antes de pasar a cobranza'
      }
    }
  },

  ProductInfo: {
    type: 'object',
    required: ['requires_student_status', 'cosigner_enabled'],
    properties: {
      requires_student_status: {
        type: 'boolean',
        example: false,
        description: 'Requiere verificación de estatus de estudiante'
      },
      cosigner_enabled: {
        type: 'boolean',
        example: true,
        description: 'Permite codeudor'
      }
    }
  },

  ParamsProduct: {
    type: 'object',
    required: ['loan_limits', 'interest_and_fees', 'payment_terms', 'product_info'],
    properties: {
      loan_limits: {
        $ref: '#/components/schemas/LoanLimits'
      },
      interest_and_fees: {
        $ref: '#/components/schemas/InterestAndFees'
      },
      payment_terms: {
        $ref: '#/components/schemas/PaymentTerms'
      },
      product_info: {
        $ref: '#/components/schemas/ProductInfo'
      }
    }
  },

  // ==================== PARAMS CLIENT CONFIGURATION ====================

  ApprovalRequirements: {
    type: 'object',
    required: [
      'min_credit_score_acceptable',
      'min_credit_score_auto_approve',
      'requires_credit_history',
      'allow_screening_alerts',
      'max_screening_alerts_allowed',
      'min_capacity_pay',
      'max_loan_active',
      'max_user_capacity_percentage'
    ],
    properties: {
      min_credit_score_acceptable: {
        type: 'integer',
        minimum: 0,
        maximum: 1000,
        example: 300,
        description: 'Puntaje mínimo aceptable de crédito'
      },
      min_credit_score_auto_approve: {
        type: 'integer',
        minimum: 0,
        maximum: 1000,
        example: 701,
        description: 'Puntaje mínimo para aprobación automática'
      },
      requires_credit_history: {
        type: 'boolean',
        example: true,
        description: 'Requiere historial crediticio'
      },
      allow_screening_alerts: {
        type: 'boolean',
        example: true,
        description: 'Permite alertas de screening'
      },
      max_screening_alerts_allowed: {
        type: 'integer',
        minimum: 0,
        example: 2,
        description: 'Máximo de alertas permitidas'
      },
      min_capacity_pay: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 100000,
        description: 'Capacidad de pago mínima requerida'
      },
      max_loan_active: {
        type: 'integer',
        minimum: 0,
        example: 1,
        description: 'Máximo de préstamos activos permitidos'
      },
      max_user_capacity_percentage: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 100,
        example: 80,
        description: 'Porcentaje máximo de capacidad del usuario'
      }
    }
  },

  CosignerRequirements: {
    type: 'object',
    required: [
      'min_credit_score',
      'min_capacity_pay',
      'requires_credit_history',
      'allow_screening_alerts',
      'max_screening_alerts_allowed',
      'max_loan_active'
    ],
    properties: {
      min_credit_score: {
        type: 'integer',
        minimum: 0,
        maximum: 1000,
        example: 650,
        description: 'Puntaje mínimo de crédito del codeudor'
      },
      min_capacity_pay: {
        type: 'number',
        format: 'float',
        minimum: 0,
        example: 100000,
        description: 'Capacidad de pago mínima del codeudor'
      },
      requires_credit_history: {
        type: 'boolean',
        example: true,
        description: 'Requiere historial crediticio del codeudor'
      },
      allow_screening_alerts: {
        type: 'boolean',
        example: true,
        description: 'Permite alertas de screening del codeudor'
      },
      max_screening_alerts_allowed: {
        type: 'integer',
        minimum: 0,
        example: 2,
        description: 'Máximo de alertas permitidas del codeudor'
      },
      max_loan_active: {
        type: 'integer',
        minimum: 0,
        example: 1,
        description: 'Máximo de préstamos activos del codeudor'
      }
    }
  },

  CosignerConfiguration: {
    type: 'object',
    required: ['cosigner_requirements'],
    properties: {
      cosigner_requirements: {
        $ref: '#/components/schemas/CosignerRequirements'
      },
      cosigner_requirements_has_primary: {
        $ref: '#/components/schemas/ApprovalRequirements',
        nullable: true,
        description: 'Requisitos cuando el codeudor es el principal'
      }
    }
  },

  ParamsClientConfiguration: {
    type: 'object',
    required: ['approval_requirements', 'cosigner_configuration'],
    properties: {
      approval_requirements: {
        $ref: '#/components/schemas/ApprovalRequirements'
      },
      cosigner_configuration: {
        $ref: '#/components/schemas/CosignerConfiguration'
      }
    }
  },

  // ==================== PRODUCT LOAN MODELS ====================

  ProductLoanPublic: {
    type: 'object',
    required: [
      'product_loan_id',
      'product_code',
      'product_name',
      'product_description',
      'params_product',
      'is_active',
      'version',
      'created_at',
      'updated_at'
    ],
    properties: {
      product_loan_id: {
        $ref: '#/components/schemas/UUID'
      },
      product_code: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[A-Z0-9_]+$',
        example: 'PRESTAMO_PERSONAL_2025',
        description: 'Código único del producto'
      },
      product_name: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        example: 'Préstamo Personal',
        description: 'Nombre del producto'
      },
      product_description: {
        type: 'string',
        minLength: 10,
        maxLength: 1000,
        example: 'Préstamo personal para cualquier propósito...',
        description: 'Descripción detallada del producto'
      },
      params_product: {
        $ref: '#/components/schemas/ParamsProduct'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el producto está activo'
      },
      version: {
        type: 'integer',
        minimum: 1,
        example: 1,
        description: 'Versión del producto'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      updated_at: {
        $ref: '#/components/schemas/Timestamp'
      }
    }
  },

  ProductLoanAdmin: {
    allOf: [
      {
        $ref: '#/components/schemas/ProductLoanPublic'
      },
      {
        type: 'object',
        required: ['params_client_configuration'],
        properties: {
          params_client_configuration: {
            $ref: '#/components/schemas/ParamsClientConfiguration'
          }
        }
      }
    ]
  },

  // ==================== REQUEST BODIES ====================

  CreateProductLoanRequest: {
    type: 'object',
    required: [
      'product_code',
      'product_name',
      'product_description',
      'params_product',
      'params_client_configuration'
    ],
    properties: {
      product_code: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        pattern: '^[A-Z0-9_]+$',
        example: 'PRESTAMO_NUEVO_2025',
        description: 'Código único del producto'
      },
      product_name: {
        type: 'string',
        minLength: 3,
        maxLength: 200,
        example: 'Préstamo Nuevo',
        description: 'Nombre del producto'
      },
      product_description: {
        type: 'string',
        minLength: 10,
        maxLength: 1000,
        example: 'Descripción del nuevo producto...',
        description: 'Descripción detallada del producto'
      },
      params_product: {
        $ref: '#/components/schemas/ParamsProduct'
      },
      params_client_configuration: {
        $ref: '#/components/schemas/ParamsClientConfiguration'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Estado inicial del producto (opcional, default: true)'
      }
    }
  },

  // DESPUÉS ✅
  RequestProductChangeRequest: {
    type: 'object',
    required: ['change_type', 'new_values', 'change_description'],
    properties: {
      change_type: {
        type: 'string',
        enum: ['UPDATE_PRODUCT', 'UPDATE_CLIENT_CONFIG', 'ACTIVATE_PRODUCT', 'DEACTIVATE_PRODUCT'],
        example: 'UPDATE_PRODUCT',
        description: 'Tipo de cambio solicitado'
      },
      new_values: {
        type: 'object',
        description: 'Estructura varía según change_type',
        oneOf: [
          {
            title: 'UPDATE_PRODUCT',
            required: ['params_product'],
            properties: {
              params_product: {
                $ref: '#/components/schemas/ParamsProduct'
              }
            }
          },
          {
            title: 'UPDATE_CLIENT_CONFIG',
            required: ['params_client_configuration'],
            properties: {
              params_client_configuration: {
                $ref: '#/components/schemas/ParamsClientConfiguration'
              }
            }
          },
          {
            title: 'ACTIVATE_PRODUCT',
            required: ['is_active'],
            properties: {
              is_active: {
                type: 'boolean',
                enum: [true],
                example: true
              }
            }
          },
          {
            title: 'DEACTIVATE_PRODUCT',
            required: ['is_active'],
            properties: {
              is_active: {
                type: 'boolean',
                enum: [false],
                example: false
              }
            }
          }
        ]
      },
      change_description: {
        type: 'string',
        minLength: 10,
        maxLength: 5000,
        example: 'Actualización de tasas de interés para Q1 2025',
        description: 'Descripción y justificación del cambio'
      }
    }
  },

  // ==================== RESPONSE MODELS ====================

  ProductLoanPublicResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/ProductLoanPublic'
          }
        }
      }
    ]
  },

  ProductLoanAdminResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/ProductLoanAdmin'
          }
        }
      }
    ]
  },

  ProductLoanListResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/PaginatedResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ProductLoanPublic'
            }
          }
        }
      }
    ]
  },

  ProductLoanAdminListResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/PaginatedResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ProductLoanAdmin'
            }
          }
        }
      }
    ]
  },

  ProductStatsResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            required: ['total', 'active', 'inactive'],
            properties: {
              total: {
                type: 'integer',
                example: 10,
                description: 'Total de productos'
              },
              active: {
                type: 'integer',
                example: 8,
                description: 'Productos activos'
              },
              inactive: {
                type: 'integer',
                example: 2,
                description: 'Productos inactivos'
              },
              percentage_active: {
                type: 'integer',
                example: 80,
                description: 'Porcentaje de productos activos'
              }
            }
          }
        }
      }
    ]
  },

  // Request body para aprobar cambios de producto
  ApproveProductChangeRequestBody: {
    type: 'object',
    properties: {
      review_notes: {
        type: 'string',
        maxLength: 5000,
        example: 'Cambios aprobados - tasas competitivas para el mercado actual',
        description: 'Notas opcionales del revisor al aprobar'
      }
    }
  },

  // Request body para rechazar cambios de producto (notas requeridas)
  RejectProductChangeRequestBody: {
    type: 'object',
    required: ['review_notes'],
    properties: {
      review_notes: {
        type: 'string',
        minLength: 10,
        maxLength: 5000,
        example: 'Rechazado - tasas demasiado altas para el mercado actual',
        description: 'Notas obligatorias del revisor explicando el motivo del rechazo (mínimo 10 caracteres)'
      }
    }
  },

  // Response de aprobación exitosa
  ApproveProductChangeResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            required: ['change_request_id', 'product_id', 'status'],
            properties: {
              change_request_id: {
                $ref: '#/components/schemas/UUID',
                description: 'ID de la solicitud de cambio aprobada'
              },
              product_id: {
                $ref: '#/components/schemas/UUID',
                description: 'ID del producto modificado'
              },
              status: {
                type: 'string',
                enum: ['approved'],
                example: 'approved',
                description: 'Estado final de la solicitud'
              }
            }
          }
        }
      }
    ]
  },

  // Response de rechazo exitoso
  RejectProductChangeResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            required: ['change_request_id', 'status'],
            properties: {
              change_request_id: {
                $ref: '#/components/schemas/UUID',
                description: 'ID de la solicitud de cambio rechazada'
              },
              status: {
                type: 'string',
                enum: ['rejected'],
                example: 'rejected',
                description: 'Estado final de la solicitud'
              }
            }
          }
        }
      }
    ]
  }
};

module.exports = productLoanSchemas;