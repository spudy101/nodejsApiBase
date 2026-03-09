/**
 * Schemas de Screening para Swagger
 * Incluye todas las estructuras de datos para el módulo de Screening
 */

const screeningSchemas = {
  // ==================== ENUMS ====================

  ScreeningType: {
    type: 'string',
    enum: ['initial_questions', 'monthly_review'],
    description: 'Tipo de screening',
    example: 'initial_questions'
  },

  ScreeningStatus: {
    type: 'string',
    enum: ['pending', 'completed', 'failed'],
    description: 'Estado del screening',
    example: 'completed'
  },

  AdminAction: {
    type: 'string',
    enum: ['mark_dangerous', 'false_positive', 'approve_with_pep_flag', 'retry', 'dismiss'],
    description: 'Acción tomada por el admin',
    example: 'approve_with_pep_flag'
  },

  ScreeningDetailType: {
    type: 'string',
    enum: ['pep', 'sanctions', 'adverse_media'],
    description: 'Tipo de detalle de screening',
    example: 'pep'
  },

  // ==================== NESTED OBJECTS ====================

  InitialAnswers: {
    type: 'object',
    required: ['is_pep', 'has_sanctions', 'has_adverse_media'],
    properties: {
      is_pep: {
        type: 'boolean',
        description: '¿Es persona expuesta políticamente?',
        example: false
      },
      has_sanctions: {
        type: 'boolean',
        description: '¿Tiene sanciones?',
        example: false
      },
      has_adverse_media: {
        type: 'boolean',
        description: '¿Aparece en medios adversos?',
        example: false
      },
      answered_at: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha en que se respondieron las preguntas',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  PersonNested: {
    type: 'object',
    properties: {
      person_id: {
        $ref: '#/components/schemas/UUID'
      },
      first_name: {
        type: 'string',
        example: 'Juan',
        description: 'Nombre de la persona'
      },
      last_name: {
        type: 'string',
        example: 'Pérez',
        description: 'Apellido de la persona'
      },
      national_id: {
        type: 'string',
        example: '1234567890',
        nullable: true,
        description: 'Número de identificación nacional'
      }
    }
  },

  ScreeningDetail: {
    type: 'object',
    properties: {
      screening_detail_id: {
        $ref: '#/components/schemas/UUID'
      },
      type: {
        $ref: '#/components/schemas/ScreeningDetailType'
      },
      zapier_relation_id: {
        type: 'string',
        example: 'CHK72f82f5fa3b48a5139964e8d2f5a6040',
        description: 'ID del check en Zapsign'
      },
      pdf_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
        example: 'https://api.zapsign.com/v1/checks/CHK.../report.pdf',
        description: 'URL del PDF del reporte (temporal, se refresca al consultar)'
      },
      has_alert: {
        type: 'boolean',
        example: false,
        description: 'Indica si se encontraron alertas significativas'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      }
    }
  },

  DetailsCount: {
    type: 'object',
    properties: {
      pep: {
        type: 'integer',
        example: 0,
        description: 'Cantidad de detalles de tipo PEP'
      },
      sanctions: {
        type: 'integer',
        example: 0,
        description: 'Cantidad de detalles de sanciones'
      },
      adverse_media: {
        type: 'integer',
        example: 0,
        description: 'Cantidad de detalles de medios adversos'
      },
      with_alerts: {
        type: 'integer',
        example: 0,
        description: 'Cantidad de detalles con alertas'
      },
      total: {
        type: 'integer',
        example: 0,
        description: 'Total de detalles'
      }
    }
  },

  // ==================== MAIN ENTITIES ====================

  ScreeningListItem: {
    type: 'object',
    properties: {
      screening_id: {
        $ref: '#/components/schemas/UUID'
      },
      type: {
        $ref: '#/components/schemas/ScreeningType'
      },
      status: {
        $ref: '#/components/schemas/ScreeningStatus'
      },
      admin_action: {
        allOf: [
          { $ref: '#/components/schemas/AdminAction' }
        ],
        nullable: true
      },
      pep_flag: {
        type: 'boolean',
        example: false,
        description: 'Flag de PEP establecido por admin'
      },
      initial_answers: {
        allOf: [
          { $ref: '#/components/schemas/InitialAnswers' }
        ],
        nullable: true,
        description: 'Respuestas iniciales del usuario (solo para type: initial_questions)'
      },
      details_count: {
        $ref: '#/components/schemas/DetailsCount'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      updated_at: {
        $ref: '#/components/schemas/Timestamp'
      }
    }
  },

  ScreeningDetailFull: {
    type: 'object',
    properties: {
      screening_id: {
        $ref: '#/components/schemas/UUID'
      },
      type: {
        $ref: '#/components/schemas/ScreeningType'
      },
      status: {
        $ref: '#/components/schemas/ScreeningStatus'
      },
      admin_action: {
        allOf: [
          { $ref: '#/components/schemas/AdminAction' }
        ],
        nullable: true
      },
      admin_notes: {
        type: 'string',
        nullable: true,
        example: 'Usuario revisado manualmente. Todo en orden.',
        description: 'Notas del admin sobre la revisión'
      },
      reviewed_at: {
        allOf: [
          { $ref: '#/components/schemas/Timestamp' }
        ],
        nullable: true
      },
      pep_flag: {
        type: 'boolean',
        example: false,
        description: 'Flag de PEP establecido por admin'
      },
      initial_answers: {
        allOf: [
          { $ref: '#/components/schemas/InitialAnswers' }
        ],
        nullable: true,
        description: 'Respuestas iniciales del usuario'
      },
      person: {
        $ref: '#/components/schemas/PersonNested'
      },
      reviewer: {
        allOf: [
          { $ref: '#/components/schemas/PersonNested' }
        ],
        nullable: true,
        description: 'Admin que revisó el screening'
      },
      details: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ScreeningDetail'
        },
        description: 'Detalles del screening (PEP, Sanctions, Adverse Media)'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      updated_at: {
        $ref: '#/components/schemas/Timestamp'
      }
    }
  },

  ScreeningStats: {
    type: 'object',
    properties: {
      total: {
        type: 'integer',
        example: 150,
        description: 'Total de screenings'
      },
      by_status: {
        type: 'object',
        properties: {
          pending: {
            type: 'integer',
            example: 10
          },
          completed: {
            type: 'integer',
            example: 130
          },
          failed: {
            type: 'integer',
            example: 10
          }
        },
        description: 'Conteo por estado'
      },
      by_type: {
        type: 'object',
        properties: {
          initial_questions: {
            type: 'integer',
            example: 100
          },
          monthly_review: {
            type: 'integer',
            example: 50
          }
        },
        description: 'Conteo por tipo'
      },
      pending_review: {
        type: 'integer',
        example: 5,
        description: 'Screenings completados pendientes de revisión admin'
      },
      with_alerts: {
        type: 'integer',
        example: 8,
        description: 'Screenings con alertas'
      },
      with_pep_flag: {
        type: 'integer',
        example: 3,
        description: 'Screenings con PEP flag activo'
      }
    }
  },

  // ==================== REQUEST BODIES ====================

  CreateInitialScreeningRequest: {
    type: 'object',
    required: ['is_pep', 'has_sanctions', 'has_adverse_media'],
    properties: {
      is_pep: {
        type: 'boolean',
        description: '¿Eres o has sido una persona expuesta políticamente (PEP)?',
        example: false
      },
      has_sanctions: {
        type: 'boolean',
        description: '¿Tienes sanciones económicas o legales activas?',
        example: false
      },
      has_adverse_media: {
        type: 'boolean',
        description: '¿Has aparecido en medios de comunicación por razones negativas?',
        example: false
      }
    }
  },

  AdminReviewRequest: {
    type: 'object',
    required: ['admin_action'],
    properties: {
      admin_action: {
        $ref: '#/components/schemas/AdminAction'
      },
      admin_notes: {
        type: 'string',
        nullable: true,
        minLength: 10,
        maxLength: 1000,
        example: 'Usuario verificado manualmente. Aprobado.',
        description: 'Notas sobre la revisión (opcional, 10-1000 caracteres)'
      },
      pep_flag: {
        type: 'boolean',
        nullable: true,
        example: true,
        description: 'Flag de PEP (requerido solo si admin_action es approve_with_pep_flag)'
      }
    }
  },

  // ==================== RESPONSE BODIES ====================

  CreateScreeningResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' }
    ],
    properties: {
      data: {
        type: 'object',
        properties: {
          screening_id: {
            $ref: '#/components/schemas/UUID'
          },
          type: {
            $ref: '#/components/schemas/ScreeningType'
          },
          status: {
            $ref: '#/components/schemas/ScreeningStatus'
          },
          created_at: {
            $ref: '#/components/schemas/Timestamp'
          },
          message: {
            type: 'string',
            example: 'Screening iniciado. Procesaremos tu información en breve.'
          }
        }
      }
    }
  },

  ListScreeningsResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginatedResponse' }
    ],
    properties: {
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ScreeningListItem'
        }
      }
    }
  },

  ScreeningDetailResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' }
    ],
    properties: {
      data: {
        $ref: '#/components/schemas/ScreeningDetailFull'
      }
    }
  },

  ScreeningStatsResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' }
    ],
    properties: {
      data: {
        $ref: '#/components/schemas/ScreeningStats'
      }
    }
  },

  AdminReviewResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' }
    ],
    properties: {
      data: {
        type: 'object',
        properties: {
          screening_id: {
            $ref: '#/components/schemas/UUID'
          },
          admin_action: {
            $ref: '#/components/schemas/AdminAction'
          },
          pep_flag: {
            type: 'boolean',
            example: false
          },
          reviewed_at: {
            $ref: '#/components/schemas/Timestamp'
          },
          message: {
            type: 'string',
            example: 'Aprobado con PEP flag. Usuario puede continuar con restricciones.'
          }
        }
      }
    }
  }
};

module.exports = screeningSchemas;