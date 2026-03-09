/**
 * Change Request Swagger Schemas - REFACTORIZADO
 */

const changeRequestSchemas = {
  ChangeRequest: {
    type: 'object',
    required: ['change_request_id', 'entity_type', 'entity_id', 'change_type', 'status', 'created_at'],
    properties: {
      change_request_id: {
        $ref: '#/components/schemas/UUID'
      },
      entity_type: {
        type: 'string',
        enum: ['product_loan', 'system_global_config', 'loan_application_review'],
        example: 'product_loan',
        description: 'Tipo de entidad que se está modificando'
      },
      entity_id: {
        $ref: '#/components/schemas/UUID',
        description: 'ID de la entidad que se está modificando'
      },
      entity: {
        type: 'object',
        description: 'Información básica de la entidad relacionada',
        nullable: true,
        oneOf: [
          {
            type: 'object',
            description: 'Para product_loan',
            properties: {
              product_loan_id: {$ref: '#/components/schemas/UUID'},
              product_code: {type: 'string'},
              product_name: {type: 'string'}
            }
          },
          {
            type: 'object',
            description: 'Para system_global_config',
            properties: {
              config_id: {$ref: '#/components/schemas/UUID'},
              config_version: {type: 'integer'},
              is_active: {type: 'boolean'}
            }
          },
          {
            type: 'object',
            description: 'Para loan_application_review',
            properties: {
              review_id: {$ref: '#/components/schemas/UUID'},
              status: {type: 'string'}
            }
          }
        ]
      },
      change_type: {
        type: 'string',
        enum: [
          'update_product',
          'update_client_config',
          'activate_product',
          'deactivate_product',
          'update_global_config',
          'activate_config_version',
          'approve_with_modifications'
        ],
        description: 'Tipo de cambio solicitado'
      },
      previous_values: {
        type: 'object',
        description: 'Valores anteriores antes del cambio'
      },
      new_values: {
        type: 'object',
        description: 'Nuevos valores propuestos'
      },
      change_description: {
        type: 'string',
        minLength: 10,
        maxLength: 5000,
        description: 'Descripción y justificación del cambio'
      },
      status: {
        type: 'string',
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        example: 'pending',
        description: 'Estado actual de la solicitud'
      },
      requester: {
        type: 'object',
        description: 'Información del administrador que solicitó el cambio',
        properties: {
          user_id: {$ref: '#/components/schemas/UUID'},
          person: {
            type: 'object',
            properties: {
              person_id: {$ref: '#/components/schemas/UUID'},
              first_name: {type: 'string'},
              last_name: {type: 'string'},
              full_name: {type: 'string'}
            }
          }
        }
      },
      reviewer: {
        type: 'object',
        nullable: true,
        description: 'Información del administrador que revisó el cambio',
        properties: {
          user_id: {$ref: '#/components/schemas/UUID'},
          person: {
            type: 'object',
            properties: {
              person_id: {$ref: '#/components/schemas/UUID'},
              first_name: {type: 'string'},
              last_name: {type: 'string'},
              full_name: {type: 'string'}
            }
          }
        }
      },
      review_notes: {
        type: 'string',
        nullable: true,
        description: 'Notas del revisor al aprobar/rechazar'
      },
      reviewed_at: {
        $ref: '#/components/schemas/Timestamp',
        nullable: true,
        description: 'Fecha y hora de revisión'
      },
      applied_at: {
        $ref: '#/components/schemas/Timestamp',
        nullable: true,
        description: 'Fecha y hora de aplicación del cambio (solo si fue aprobado)'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp',
        description: 'Fecha de creación de la solicitud'
      },
      updated_at: {
        $ref: '#/components/schemas/Timestamp',
        description: 'Fecha de última actualización'
      }
    }
  },

  ChangeRequestStatsResponse: {
    allOf: [
      {$ref: '#/components/schemas/SuccessResponse'},
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            required: ['total', 'by_status', 'by_entity_type', 'by_change_type'],
            properties: {
              total: {
                type: 'integer',
                example: 150,
                description: 'Total de solicitudes de cambio'
              },
              by_status: {
                type: 'object',
                description: 'Distribución por estado',
                properties: {
                  pending: {type: 'integer', example: 25},
                  approved: {type: 'integer', example: 100},
                  rejected: {type: 'integer', example: 20},
                  cancelled: {type: 'integer', example: 5}
                }
              },
              by_entity_type: {
                type: 'object',
                description: 'Distribución por tipo de entidad',
                properties: {
                  product_loan: {type: 'integer', example: 80},
                  system_global_config: {type: 'integer', example: 50},
                  loan_application_review: {type: 'integer', example: 20}
                }
              },
              by_change_type: {
                type: 'object',
                description: 'Distribución por tipo de cambio',
                additionalProperties: {type: 'integer'}
              },
              pending_percentage: {
                type: 'integer',
                example: 17,
                description: 'Porcentaje de solicitudes pendientes'
              },
              approved_percentage: {
                type: 'integer',
                example: 67,
                description: 'Porcentaje de solicitudes aprobadas'
              },
              rejected_percentage: {
                type: 'integer',
                example: 13,
                description: 'Porcentaje de solicitudes rechazadas'
              }
            }
          }
        }
      }
    ]
  },

  // ==================== CHANGE REQUEST SCHEMAS ====================

  /**
   * ChangeRequestEntitySummary
   * Shape genérico y normalizado que representa la entidad afectada en el listado.
   * Siempre tiene la misma estructura sin importar entity_type.
   * El frontend usa entity_type del item padre para saber a qué módulo pertenece
   * y construir el link al detalle correspondiente.
   *
   *   entity_type = 'product_loan'             → label: "LOAN-001 — Préstamo Personal"   | status: null
   *   entity_type = 'system_global_config'     → label: "Configuración global v3"         | status: null
   *   entity_type = 'loan_application_review'  → label: "Revisión de solicitud"           | status: "pending_admin" | ...
   *   entity_type = 'loan'                     → label: "Préstamo"                        | status: "active" | ...
   */
  ChangeRequestEntitySummary: {
    nullable: true,
    type: 'object',
    properties: {
      id: {
        allOf: [{ $ref: '#/components/schemas/UUID' }],
        description: 'PK de la entidad afectada. Usar junto a entity_type para navegar al detalle.',
      },
      label: {
        type: 'string',
        description: 'Texto legible para identificar la entidad en el listado.',
        example: 'LOAN-001 — Préstamo Personal',
      },
      status: {
        type: 'string',
        nullable: true,
        description: 'Estado propio de la entidad. Presente solo cuando entity_type tiene estado (loan, loan_application_review). Null para product_loan y system_global_config.',
        example: 'pending_admin',
      },
    },
  },

  ChangeRequestListItem: {
    type: 'object',
    properties: {
      change_request_id: { $ref: '#/components/schemas/UUID' },
      entity_type: {
        type: 'string',
        enum: ['product_loan', 'system_global_config', 'loan_application_review', 'loan'],
        description: 'Tipo de entidad afectada por el cambio.',
        example: 'product_loan',
      },
      entity_id: {
        allOf: [{ $ref: '#/components/schemas/UUID' }],
        description: 'ID de la entidad afectada. Igual a entity.id, incluido por conveniencia.',
      },
      entity: { $ref: '#/components/schemas/ChangeRequestEntitySummary' },
      change_type: {
        type: 'string',
        enum: [
          'update_product',
          'update_client_config',
          'activate_product',
          'deactivate_product',
          'update_global_config',
          'activate_config_version',
          'approve_with_modifications',
          'update_loan_rates',
        ],
        example: 'update_product',
      },
      change_description: {
        type: 'string',
        example: 'Actualización de tasas de interés',
      },
      status: {
        type: 'string',
        enum: ['pending', 'approved', 'rejected', 'cancelled'],
        example: 'pending',
      },
      requester: {
        type: 'object',
        properties: {
          user_id:   { $ref: '#/components/schemas/UUID' },
          full_name: { type: 'string', example: 'Juan Pérez' },
        },
      },
      reviewer: {
        nullable: true,
        type: 'object',
        properties: {
          user_id:   { $ref: '#/components/schemas/UUID' },
          full_name: { type: 'string', example: 'María González' },
        },
      },
      reviewed_at: { allOf: [{ $ref: '#/components/schemas/Timestamp' }], nullable: true },
      created_at:  { $ref: '#/components/schemas/Timestamp' },
      updated_at:  { $ref: '#/components/schemas/Timestamp' },
    },
  },

  ChangeRequestListResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/ChangeRequestListItem' },
          },
          metadata: { $ref: '#/components/schemas/PaginationMetadata' },
        },
      },
    ],
  },
};

module.exports = changeRequestSchemas;