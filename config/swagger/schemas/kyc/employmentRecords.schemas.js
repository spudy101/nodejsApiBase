/**
 * Schemas de Employment Records (Documentos Laborales)
 * Define todos los schemas necesarios para la documentación de la API
 */

const employmentRecordSchemas = {
  // ==================== ENUMS ====================

  EmploymentType: {
    type: 'string',
    enum: ['dependiente', 'independiente'],
    description: 'Tipo de empleo del usuario',
    example: 'dependiente'
  },

  EmploymentStatus: {
    type: 'string',
    enum: [
      'pendiente',
      'aprobado',
      'rechazado',
      'requiere_renovacion',
      'pendiente_renovacion',
      'expirado',
      'dado_de_baja'
    ],
    description: 'Estado del registro laboral',
    example: 'aprobado'
  },

  DocumentType: {
    type: 'string',
    enum: ['contrato', 'liquidacion', 'boleta'],
    description: 'Tipo de documento laboral',
    example: 'contrato'
  },

  ReviewAction: {
    type: 'string',
    enum: ['aprobar', 'rechazar', 'solicitar_renovacion'],
    description: 'Acción realizada en la revisión',
    example: 'aprobar'
  },

  // ==================== NESTED OBJECTS ====================

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
        nullable: true,
        example: '12345678-9',
        description: 'RUT, DNI u otro identificador nacional'
      }
    }
  },

  EmploymentDocument: {
    type: 'object',
    properties: {
      employment_document_id: {
        $ref: '#/components/schemas/UUID'
      },
      document_type: {
        $ref: '#/components/schemas/DocumentType'
      },
      file_url: {
        type: 'string',
        format: 'uri',
        example: 'https://bucket.s3.amazonaws.com/employment-documents/contratos/uuid.pdf',
        description: 'URL del archivo en S3'
      },
      file_name: {
        type: 'string',
        example: 'contrato_trabajo.pdf',
        description: 'Nombre original del archivo'
      },
      file_size: {
        type: 'integer',
        example: 524288,
        description: 'Tamaño del archivo en bytes'
      },
      uploaded_at: {
        $ref: '#/components/schemas/Timestamp'
      }
    }
  },

  EmploymentReview: {
    type: 'object',
    properties: {
      employment_review_id: {
        $ref: '#/components/schemas/UUID'
      },
      action: {
        $ref: '#/components/schemas/ReviewAction'
      },
      reason: {
        type: 'string',
        nullable: true,
        example: 'Liquidaciones incompletas',
        description: 'Razón de rechazo o comentarios'
      },
      previous_status: {
        $ref: '#/components/schemas/EmploymentStatus'
      },
      new_status: {
        $ref: '#/components/schemas/EmploymentStatus'
      },
      reviewed_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      reviewer: {
        $ref: '#/components/schemas/PersonNested'
      }
    }
  },

  DocumentsCount: {
    type: 'object',
    properties: {
      contrato: {
        type: 'integer',
        example: 1,
        description: 'Cantidad de contratos'
      },
      liquidacion: {
        type: 'integer',
        example: 3,
        description: 'Cantidad de liquidaciones'
      },
      boleta: {
        type: 'integer',
        example: 0,
        description: 'Cantidad de boletas'
      },
      total: {
        type: 'integer',
        example: 4,
        description: 'Total de documentos'
      }
    }
  },

  // ==================== MAIN OBJECTS ====================

  EmploymentRecordList: {
    type: 'object',
    required: [
      'employment_record_id',
      'employment_type',
      'is_employed',
      'status',
      'created_at',
      'updated_at'
    ],
    properties: {
      employment_record_id: {
        $ref: '#/components/schemas/UUID'
      },
      employment_type: {
        $ref: '#/components/schemas/EmploymentType'
      },
      company_name: {
        type: 'string',
        nullable: true,
        example: 'Empresa ABC S.A.',
        description: 'Nombre de la empresa donde trabaja'
      },
      is_employed: {
        type: 'boolean',
        example: true,
        description: 'Indica si el usuario trabaja actualmente'
      },
      monthly_salary: {
        type: 'number',
        format: 'float',
        nullable: true,
        example: 1500000,
        description: 'Salario mensual'
      },
      status: {
        $ref: '#/components/schemas/EmploymentStatus'
      },
      rejection_reason: {
        type: 'string',
        nullable: true,
        example: 'Las liquidaciones no están completas',
        description: 'Razón del rechazo si aplica'
      },
      approved_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-20T15:30:00.000Z',
        description: 'Fecha de aprobación'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      updated_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      documents_count: {
        $ref: '#/components/schemas/DocumentsCount'
      }
    }
  },

  EmploymentRecordDetail: {
    type: 'object',
    required: [
      'employment_record_id',
      'employment_type',
      'is_employed',
      'status',
      'created_at',
      'updated_at'
    ],
    properties: {
      employment_record_id: {
        $ref: '#/components/schemas/UUID'
      },
      employment_type: {
        $ref: '#/components/schemas/EmploymentType'
      },
      company_name: {
        type: 'string',
        nullable: true,
        example: 'Empresa ABC S.A.',
        description: 'Nombre de la empresa donde trabaja'
      },
      is_employed: {
        type: 'boolean',
        example: true,
        description: 'Indica si el usuario trabaja actualmente'
      },
      monthly_salary: {
        type: 'number',
        format: 'float',
        nullable: true,
        example: 1500000,
        description: 'Salario mensual'
      },
      status: {
        $ref: '#/components/schemas/EmploymentStatus'
      },
      rejection_reason: {
        type: 'string',
        nullable: true,
        example: 'Las liquidaciones no están completas',
        description: 'Razón del rechazo si aplica'
      },
      approved_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-20T15:30:00.000Z',
        description: 'Fecha de aprobación'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      updated_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      person: {
        $ref: '#/components/schemas/PersonNested'
      },
      reviewer: {
        allOf: [
          { $ref: '#/components/schemas/PersonNested' }
        ],
        nullable: true,
        description: 'Admin que revisó el registro'
      },
      documents: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/EmploymentDocument'
        },
        description: 'Lista de documentos adjuntos'
      },
      reviews: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/EmploymentReview'
        },
        description: 'Historial de revisiones'
      }
    }
  },

  EmploymentRecordCreated: {
    type: 'object',
    required: [
      'employment_record_id',
      'employment_type',
      'is_employed',
      'status',
      'created_at'
    ],
    properties: {
      employment_record_id: {
        $ref: '#/components/schemas/UUID'
      },
      employment_type: {
        $ref: '#/components/schemas/EmploymentType'
      },
      company_name: {
        type: 'string',
        nullable: true,
        example: 'Empresa ABC S.A.'
      },
      is_employed: {
        type: 'boolean',
        example: true
      },
      monthly_salary: {
        type: 'number',
        format: 'float',
        nullable: true,
        example: 1500000
      },
      status: {
        $ref: '#/components/schemas/EmploymentStatus'
      },
      created_at: {
        $ref: '#/components/schemas/Timestamp'
      },
      documents: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/EmploymentDocument'
        }
      }
    }
  },

  EmploymentRecordStats: {
    type: 'object',
    properties: {
      total: {
        type: 'integer',
        example: 150,
        description: 'Total de registros laborales'
      },
      by_status: {
        type: 'object',
        properties: {
          pendiente: {
            type: 'integer',
            example: 10
          },
          aprobado: {
            type: 'integer',
            example: 120
          },
          rechazado: {
            type: 'integer',
            example: 15
          },
          requiere_renovacion: {
            type: 'integer',
            example: 3
          },
          pendiente_renovacion: {
            type: 'integer',
            example: 1
          },
          expirado: {
            type: 'integer',
            example: 0
          },
          dado_de_baja: {
            type: 'integer',
            example: 1
          }
        },
        description: 'Cantidad de registros por estado'
      },
      by_employment_type: {
        type: 'object',
        properties: {
          dependiente: {
            type: 'integer',
            example: 100
          },
          independiente: {
            type: 'integer',
            example: 50
          }
        },
        description: 'Cantidad de registros por tipo de empleo'
      },
      pending_review: {
        type: 'integer',
        example: 11,
        description: 'Registros pendientes de revisión (pendiente + pendiente_renovacion)'
      }
    }
  },

  // ==================== REQUEST BODIES ====================

  CreateEmploymentRecordRequest: {
    type: 'object',
    required: ['employment_type', 'is_employed'],
    properties: {
      employment_type: {
        $ref: '#/components/schemas/EmploymentType'
      },
      is_employed: {
        type: 'boolean',
        example: true,
        description: 'true si trabaja, false si no trabaja'
      },
      company_name: {
        type: 'string',
        example: 'Empresa ABC S.A.',
        minLength: 2,
        maxLength: 200,
        description: 'Nombre de la empresa (requerido si is_employed = true)'
      },
      monthly_salary: {
        type: 'number',
        format: 'float',
        example: 1500000,
        minimum: 0,
        description: 'Salario mensual (requerido si is_employed = true)'
      }
    }
  },

  ConfirmRenewalRequest: {
    type: 'object',
    required: ['use_same_documents'],
    properties: {
      use_same_documents: {
        type: 'boolean',
        example: true,
        description: 'true para usar los mismos documentos, false para subir nuevos'
      }
    }
  },

  RejectEmploymentRecordRequest: {
    type: 'object',
    required: ['rejection_reason'],
    properties: {
      rejection_reason: {
        type: 'string',
        example: 'Las liquidaciones están incompletas o son ilegibles',
        minLength: 10,
        maxLength: 1000,
        description: 'Motivo del rechazo'
      }
    }
  },

  // ==================== RESPONSE WRAPPERS ====================

  EmploymentRecordListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginatedResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/EmploymentRecordList'
            }
          }
        }
      }
    ]
  },

  EmploymentRecordDetailResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/EmploymentRecordDetail'
          }
        }
      }
    ]
  },

  EmploymentRecordCreatedResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/EmploymentRecordCreated'
          }
        }
      }
    ]
  },

  EmploymentRecordStatsResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/EmploymentRecordStats'
          }
        }
      }
    ]
  },

  EmploymentRecordActionResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              employment_record_id: {
                $ref: '#/components/schemas/UUID'
              },
              status: {
                $ref: '#/components/schemas/EmploymentStatus'
              },
              rejection_reason: {
                type: 'string',
                nullable: true,
                description: 'Razón del rechazo (solo si fue rechazado)'
              }
            }
          }
        }
      }
    ]
  }
};

module.exports = employmentRecordSchemas;