/**
 * System Global Config Swagger Schemas
 * Esquemas para la documentación de configuración global del sistema
 */

const systemGlobalConfigSchemas = {
  // ==================== CONFIG COMPONENTS ====================

  CreditScoreThresholds: {
    type: 'object',
    required: ['poor', 'fair', 'good', 'excellent'],
    properties: {
      poor: {
        type: 'integer',
        minimum: 0,
        maximum: 1000,
        example: 250,
        description: 'Umbral máximo para puntaje pobre (0-250)'
      },
      fair: {
        type: 'integer',
        minimum: 0,
        maximum: 1000,
        example: 400,
        description: 'Umbral máximo para puntaje regular (251-400)'
      },
      good: {
        type: 'integer',
        minimum: 0,
        maximum: 1000,
        example: 550,
        description: 'Umbral máximo para puntaje bueno (401-550)'
      },
      excellent: {
        type: 'integer',
        minimum: 0,
        maximum: 1000,
        example: 700,
        description: 'Umbral mínimo para puntaje excelente (551+)'
      }
    }
  },

  ScoreAdjustmentPenalties: {
    type: 'object',
    required: [
      'no_credit_history',
      'poor_credit_score',
      'fair_credit_score',
      'good_credit_score',
      'excellent_credit_score',
      'screening_alert_penalty'
    ],
    properties: {
      no_credit_history: {
        type: 'number',
        format: 'float',
        minimum: -100,
        maximum: 0,
        example: -30,
        description: 'Penalización por falta de historial crediticio (%)'
      },
      poor_credit_score: {
        type: 'number',
        format: 'float',
        minimum: -100,
        maximum: 0,
        example: -40,
        description: 'Penalización por puntaje pobre (%)'
      },
      fair_credit_score: {
        type: 'number',
        format: 'float',
        minimum: -100,
        maximum: 0,
        example: -25,
        description: 'Penalización por puntaje regular (%)'
      },
      good_credit_score: {
        type: 'number',
        format: 'float',
        minimum: -100,
        maximum: 0,
        example: -10,
        description: 'Penalización por puntaje bueno (%)'
      },
      excellent_credit_score: {
        type: 'number',
        format: 'float',
        minimum: -100,
        maximum: 0,
        example: 0,
        description: 'Penalización por puntaje excelente (%) - usualmente 0'
      },
      screening_alert_penalty: {
        type: 'number',
        format: 'float',
        minimum: -100,
        maximum: 0,
        example: -25,
        description: 'Penalización por alertas de screening (%)'
      }
    }
  },

  DebtCapacityLimits: {
    type: 'object',
    required: [
      'max_debt_to_income_percentage',
      'max_debt_to_income_with_cosigner',
      'max_loan_to_income_multiplier'
    ],
    properties: {
      max_debt_to_income_percentage: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 100,
        example: 35,
        description: 'Máximo porcentaje deuda/ingreso sin codeudor (%)'
      },
      max_debt_to_income_with_cosigner: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 100,
        example: 40,
        description: 'Máximo porcentaje deuda/ingreso con codeudor (%)'
      },
      max_loan_to_income_multiplier: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 20,
        example: 3,
        description: 'Multiplicador máximo de ingreso para monto de préstamo'
      }
    }
  },

  // ==================== MAIN MODEL ====================

  SystemGlobalConfig: {
    type: 'object',
    required: [
      'config_id',
      'config_version',
      'is_active',
      'credit_score_thresholds',
      'score_adjustment_penalties',
      'debt_capacity_limits',
      'currency',
      'vat_percentage',
      'created_at',
      'updated_at'
    ],
    properties: {
      config_id: {
        $ref: '#/components/schemas/UUID'
      },
      config_version: {
        type: 'integer',
        minimum: 1,
        example: 1,
        description: 'Versión de la configuración'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si es la configuración activa'
      },
      credit_score_thresholds: {
        $ref: '#/components/schemas/CreditScoreThresholds'
      },
      score_adjustment_penalties: {
        $ref: '#/components/schemas/ScoreAdjustmentPenalties'
      },
      debt_capacity_limits: {
        $ref: '#/components/schemas/DebtCapacityLimits'
      },
      currency: {
        type: 'string',
        minLength: 3,
        maxLength: 10,
        pattern: '^[A-Z]{3,10}$',
        example: 'CLP',
        description: 'Código de moneda (ISO 4217)'
      },
      vat_percentage: {
        type: 'number',
        format: 'float',
        minimum: 0,
        maximum: 100,
        example: 19.00,
        description: 'Porcentaje de IVA (%)'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      updated_at: {
        $ref: '#/components/schemas/Timestamp'
      }
    }
  },

  SystemGlobalConfigHistoryItem: {
    type: 'object',
    required: ['config_id', 'config_version', 'is_active', 'currency', 'vat_percentage', 'created_at', 'updated_at'],
    properties: {
      config_id: {
        $ref: '#/components/schemas/UUID'
      },
      config_version: {
        type: 'integer',
        example: 1,
        description: 'Versión de la configuración'
      },
      is_active: {
        type: 'boolean',
        example: false,
        description: 'Indica si es la configuración activa'
      },
      currency: {
        type: 'string',
        example: 'CLP',
        description: 'Código de moneda'
      },
      vat_percentage: {
        type: 'number',
        format: 'float',
        example: 19.00,
        description: 'Porcentaje de IVA'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      updated_at: {
        $ref: '#/components/schemas/Timestamp'
      }
    }
  },

  // ==================== REQUEST BODIES ====================

  RequestGlobalConfigChangeRequest: {
    type: 'object',
    required: ['change_type', 'new_values', 'change_description'],
    properties: {
      change_type: {
        type: 'string',
        enum: ['update_global_config', 'activate_config_version'],
        example: 'update_global_config',
        description: 'Tipo de cambio solicitado'
      },
      new_values: {
        oneOf: [
          {
            type: 'object',
            description: 'Para update_global_config: nueva configuración completa',
            required: [
              'credit_score_thresholds',
              'score_adjustment_penalties',
              'debt_capacity_limits',
              'currency',
              'vat_percentage'
            ],
            properties: {
              credit_score_thresholds: {
                $ref: '#/components/schemas/CreditScoreThresholds'
              },
              score_adjustment_penalties: {
                $ref: '#/components/schemas/ScoreAdjustmentPenalties'
              },
              debt_capacity_limits: {
                $ref: '#/components/schemas/DebtCapacityLimits'
              },
              currency: {
                type: 'string',
                pattern: '^[A-Z]{3,10}$',
                example: 'CLP'
              },
              vat_percentage: {
                type: 'number',
                format: 'float',
                minimum: 0,
                maximum: 100,
                example: 19.00
              }
            }
          },
          {
            type: 'object',
            description: 'Para activate_config_version: versión a activar',
            required: ['config_version'],
            properties: {
              config_version: {
                type: 'integer',
                minimum: 1,
                example: 3,
                description: 'Número de versión a activar'
              }
            }
          }
        ]
      },
      change_description: {
        type: 'string',
        minLength: 10,
        maxLength: 5000,
        example: 'Ajuste de umbrales de credit score para Q1 2025',
        description: 'Descripción y justificación del cambio'
      }
    }
  },

  // ==================== RESPONSE MODELS ====================

  SystemGlobalConfigResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/SystemGlobalConfig'
          }
        }
      }
    ]
  },

  SystemGlobalConfigHistoryResponse: {
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
              $ref: '#/components/schemas/SystemGlobalConfigHistoryItem'
            }
          }
        }
      }
    ]
  },

  SystemGlobalConfigStatsResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            required: ['active_version', 'total_versions', 'last_updated'],
            properties: {
              active_version: {
                type: 'integer',
                example: 1,
                description: 'Versión activa actual'
              },
              total_versions: {
                type: 'integer',
                example: 5,
                description: 'Total de versiones en historial'
              },
              last_updated: {
                $ref: '#/components/schemas/Timestamp',
                description: 'Fecha del último cambio'
              }
            }
          }
        }
      }
    ]
  },

  // Request body para aprobar cambios de configuración global
  ApproveConfigChangeRequestBody: {
    type: 'object',
    properties: {
      review_notes: {
        type: 'string',
        maxLength: 5000,
        example: 'Cambios aprobados - ajustes necesarios para Q1 2025',
        description: 'Notas opcionales del revisor al aprobar'
      }
    }
  },

  // Request body para rechazar cambios de configuración global (notas requeridas)
  RejectConfigChangeRequestBody: {
    type: 'object',
    required: ['review_notes'],
    properties: {
      review_notes: {
        type: 'string',
        minLength: 10,
        maxLength: 5000,
        example: 'Rechazado - umbrales muy restrictivos para el mercado actual',
        description: 'Notas obligatorias del revisor explicando el motivo del rechazo (mínimo 10 caracteres)'
      }
    }
  },

  // Response de aprobación exitosa
  ApproveConfigChangeResponse: {
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
                description: 'ID de la solicitud de cambio aprobada'
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
  RejectConfigChangeResponse: {
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

module.exports = systemGlobalConfigSchemas;