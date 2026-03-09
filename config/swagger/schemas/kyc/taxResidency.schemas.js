/**
 * Schemas para Tax Residency
 * Incluye todos los objetos, request bodies y responses del módulo
 */

const taxResidencySchemas = {
  // ==================== OBJETOS BASE ====================

  TaxResidencyCountry: {
    type: 'object',
    required: ['country_id', 'tin'],
    properties: {
      country_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'UUID del país de residencia fiscal'
      },
      tin: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        example: '12-3456789',
        description: 'Tax Identification Number del país'
      }
    }
  },

  PersonLocation: {
    type: 'object',
    properties: {
      person_location_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID de la ubicación'
      },
      address: {
        type: 'string',
        example: 'Av. Principal 123, Depto 456',
        description: 'Dirección completa'
      },
      postal_code: {
        type: 'string',
        example: '12345',
        description: 'Código postal',
        nullable: true
      },
      type: {
        type: 'string',
        example: 'residence',
        description: 'Tipo de dirección',
        nullable: true
      },
      country: {
        type: 'object',
        properties: {
          country_id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            example: 'Chile'
          },
          code: {
            type: 'string',
            example: 'CL'
          }
        }
      },
      city: {
        type: 'object',
        properties: {
          city_id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            example: 'Santiago'
          }
        }
      },
      department: {
        type: 'object',
        properties: {
          department_id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            example: 'Región Metropolitana'
          }
        }
      }
    }
  },

  PersonNested: {
    type: 'object',
    properties: {
      person_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID de la persona'
      },
      first_name: {
        type: 'string',
        example: 'Juan',
        description: 'Nombre'
      },
      last_name: {
        type: 'string',
        example: 'Pérez',
        description: 'Apellido'
      },
      national_id: {
        type: 'string',
        example: '12345678-9',
        description: 'RUT, DNI, SSN, etc.',
        nullable: true
      },
      birth_date: {
        type: 'string',
        format: 'date',
        example: '1990-01-15',
        nullable: true
      },
      location: {
        $ref: '#/components/schemas/PersonLocation',
        nullable: true
      },
      country: {
        type: 'object',
        nullable: true,
        properties: {
          country_id: {
            type: 'string',
            format: 'uuid'
          },
          name: {
            type: 'string',
            example: 'Chile'
          },
          code: {
            type: 'string',
            example: 'CL'
          }
        }
      }
    }
  },

  ReviewerNested: {
    type: 'object',
    nullable: true,
    properties: {
      person_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID del admin que revisó'
      },
      first_name: {
        type: 'string',
        example: 'Admin',
        description: 'Nombre del admin'
      },
      last_name: {
        type: 'string',
        example: 'Sistema',
        description: 'Apellido del admin'
      }
    }
  },

  // ==================== TAX RESIDENCY OBJECTS ====================

  TaxResidencyList: {
    type: 'object',
    properties: {
      tax_residency_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID único de la tax residency'
      },
      is_us_taxpayer: {
        type: 'boolean',
        description: '¿Paga impuestos en Estados Unidos?'
      },
      is_us_person: {
        type: 'boolean',
        nullable: true,
        description: 'Solo si is_us_taxpayer = true. True = individuo (W-9), False = entidad (W-8)'
      },
      form_type: {
        type: 'string',
        enum: ['w8', 'w9', null],
        nullable: true,
        description: 'Tipo de formulario fiscal'
      },
      document_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
        example: 'https://s3.amazonaws.com/bucket/tax-forms/form.pdf',
        description: 'URL del documento W-8/W-9 en S3'
      },
      us_tin: {
        type: 'string',
        nullable: true,
        example: '123-45-6789',
        description: 'Tax Identification Number de USA'
      },
      has_same_tax_residency_as_bank: {
        type: 'boolean',
        nullable: true,
        description: '¿Su residencia fiscal es igual a la del banco?'
      },
      tax_countries: {
        type: 'array',
        nullable: true,
        items: {
          $ref: '#/components/schemas/TaxResidencyCountry'
        },
        description: 'Países de residencia fiscal (CRS)'
      },
      declaration_accepted_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Fecha en que aceptó la declaración bajo juramento'
      },
      status: {
        type: 'string',
        enum: ['pending', 'approved', 'rejected', 'change_requested', 'deactivation_requested', 'inactive'],
        description: 'Estado de la tax residency'
      },
      rejection_reason: {
        type: 'string',
        nullable: true,
        description: 'Razón de rechazo del admin'
      },
      reviewed_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Fecha de revisión por el admin'
      },
      change_reason: {
        type: 'string',
        nullable: true,
        description: 'Razón de solicitud de cambio'
      },
      change_requested_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Fecha de solicitud de cambio'
      },
      deactivation_reason: {
        type: 'string',
        nullable: true,
        description: 'Razón de solicitud de baja'
      },
      deactivation_requested_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Fecha de solicitud de baja'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de creación'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de última actualización'
      },
      person: {
        type: 'object',
        properties: {
          person_id: {
            type: 'string',
            format: 'uuid'
          },
          first_name: {
            type: 'string',
            example: 'Juan'
          },
          last_name: {
            type: 'string',
            example: 'Pérez'
          },
          national_id: {
            type: 'string',
            example: '12345678-9',
            nullable: true
          }
        }
      },
      reviewer: {
        $ref: '#/components/schemas/ReviewerNested'
      }
    }
  },

  TaxResidencyDetail: {
    type: 'object',
    properties: {
      tax_residency_id: {
        type: 'string',
        format: 'uuid',
        description: 'ID único de la tax residency'
      },
      is_us_taxpayer: {
        type: 'boolean',
        description: '¿Paga impuestos en Estados Unidos?'
      },
      is_us_person: {
        type: 'boolean',
        nullable: true,
        description: 'Solo si is_us_taxpayer = true. True = individuo (W-9), False = entidad (W-8)'
      },
      form_type: {
        type: 'string',
        enum: ['w8', 'w9', null],
        nullable: true,
        description: 'Tipo de formulario fiscal'
      },
      document_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
        example: 'https://s3.amazonaws.com/bucket/tax-forms/form.pdf',
        description: 'URL del documento W-8/W-9 en S3'
      },
      us_tin: {
        type: 'string',
        nullable: true,
        example: '123-45-6789',
        description: 'Tax Identification Number de USA'
      },
      has_same_tax_residency_as_bank: {
        type: 'boolean',
        nullable: true,
        description: '¿Su residencia fiscal es igual a la del banco?'
      },
      tax_countries: {
        type: 'array',
        nullable: true,
        items: {
          $ref: '#/components/schemas/TaxResidencyCountry'
        },
        description: 'Países de residencia fiscal (CRS)'
      },
      declaration_text: {
        type: 'string',
        nullable: true,
        description: 'Texto de la declaración bajo juramento'
      },
      declaration_accepted_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Fecha en que aceptó la declaración bajo juramento'
      },
      status: {
        type: 'string',
        enum: ['pending', 'approved', 'rejected', 'change_requested', 'deactivation_requested', 'inactive'],
        description: 'Estado de la tax residency'
      },
      rejection_reason: {
        type: 'string',
        nullable: true,
        description: 'Razón de rechazo del admin'
      },
      reviewed_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Fecha de revisión por el admin'
      },
      change_reason: {
        type: 'string',
        nullable: true,
        description: 'Razón de solicitud de cambio'
      },
      change_requested_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Fecha de solicitud de cambio'
      },
      new_tax_residency_data: {
        type: 'object',
        nullable: true,
        description: 'Datos de la nueva tax residency solicitada'
      },
      new_document_url: {
        type: 'string',
        format: 'uri',
        nullable: true,
        description: 'URL del nuevo documento para cambio'
      },
      deactivation_reason: {
        type: 'string',
        nullable: true,
        description: 'Razón de solicitud de baja'
      },
      deactivation_requested_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        description: 'Fecha de solicitud de baja'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de creación'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        description: 'Fecha de última actualización'
      },
      person: {
        $ref: '#/components/schemas/PersonNested'
      },
      reviewer: {
        $ref: '#/components/schemas/ReviewerNested'
      }
    }
  },

  TaxResidencyStats: {
    type: 'object',
    properties: {
      total: {
        type: 'integer',
        example: 150,
        description: 'Total de tax residencies'
      },
      by_status: {
        type: 'object',
        properties: {
          pending: {
            type: 'integer',
            example: 10
          },
          approved: {
            type: 'integer',
            example: 120
          },
          rejected: {
            type: 'integer',
            example: 5
          },
          change_requested: {
            type: 'integer',
            example: 8
          },
          deactivation_requested: {
            type: 'integer',
            example: 3
          },
          inactive: {
            type: 'integer',
            example: 4
          }
        }
      },
      by_form_type: {
        type: 'object',
        properties: {
          w8: {
            type: 'integer',
            example: 30
          },
          w9: {
            type: 'integer',
            example: 90
          }
        }
      },
      pending_review: {
        type: 'integer',
        example: 21,
        description: 'Total pendientes de revisión (pending + change_requested + deactivation_requested)'
      },
      change_requests: {
        type: 'integer',
        example: 8,
        description: 'Solicitudes de cambio pendientes'
      },
      deactivation_requests: {
        type: 'integer',
        example: 3,
        description: 'Solicitudes de baja pendientes'
      }
    }
  },

  // ==================== REQUEST BODIES ====================

  CreateTaxResidencyRequest: {
    type: 'object',
    required: ['is_us_taxpayer'],
    properties: {
      is_us_taxpayer: {
        type: 'boolean',
        description: '¿Paga impuestos en Estados Unidos?'
      },
      is_us_person: {
        type: 'boolean',
        description: 'Requerido si is_us_taxpayer = true. True = individuo (W-9), False = entidad (W-8)'
      },
      us_tin: {
        type: 'string',
        minLength: 2,
        maxLength: 50,
        description: 'Requerido si is_us_taxpayer = true. Tax Identification Number de USA'
      },
      has_same_tax_residency_as_bank: {
        type: 'boolean',
        description: 'Requerido si is_us_taxpayer = false. ¿Su residencia fiscal es igual a la del banco?'
      },
      declaration_accepted: {
        type: 'boolean',
        description: 'Requerido si is_us_taxpayer = false y has_same_tax_residency_as_bank = false. Debe ser true.'
      },
      tax_countries: {
        type: 'array',
        minItems: 1,
        items: {
          $ref: '#/components/schemas/TaxResidencyCountry'
        },
        description: 'Requerido si is_us_taxpayer = false y has_same_tax_residency_as_bank = false'
      },
      tax_form: {
        type: 'string',
        format: 'binary',
        description: 'Archivo PDF del formulario W-8 o W-9 (requerido si is_us_taxpayer = true)'
      }
    }
  },

  RequestChangeRequest: {
    type: 'object',
    required: ['change_reason', 'new_tax_residency_data'],
    properties: {
      change_reason: {
        type: 'string',
        minLength: 10,
        maxLength: 1000,
        example: 'Me mudé a otro país y cambió mi situación fiscal',
        description: 'Razón del cambio solicitado'
      },
      new_tax_residency_data: {
        type: 'object',
        required: ['is_us_taxpayer'],
        properties: {
          is_us_taxpayer: {
            type: 'boolean',
            description: '¿Paga impuestos en Estados Unidos? (nueva situación)'
          },
          is_us_person: {
            type: 'boolean',
            description: 'Si is_us_taxpayer = true'
          },
          us_tin: {
            type: 'string',
            description: 'Si is_us_taxpayer = true'
          },
          has_same_tax_residency_as_bank: {
            type: 'boolean',
            description: 'Si is_us_taxpayer = false'
          },
          declaration_accepted: {
            type: 'boolean',
            description: 'Si is_us_taxpayer = false y has_same_tax_residency_as_bank = false'
          },
          tax_countries: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/TaxResidencyCountry'
            },
            description: 'Si is_us_taxpayer = false y has_same_tax_residency_as_bank = false'
          }
        }
      },
      new_tax_form: {
        type: 'string',
        format: 'binary',
        description: 'Nuevo archivo PDF del formulario W-8 o W-9 (si la nueva situación requiere formulario USA)'
      }
    }
  },

  RequestDeactivationRequest: {
    type: 'object',
    required: ['deactivation_reason'],
    properties: {
      deactivation_reason: {
        type: 'string',
        minLength: 10,
        maxLength: 1000,
        example: 'Ya no necesito esta declaración fiscal',
        description: 'Razón de la solicitud de baja'
      }
    }
  },

  RejectRequest: {
    type: 'object',
    required: ['rejection_reason'],
    properties: {
      rejection_reason: {
        type: 'string',
        minLength: 10,
        maxLength: 1000,
        example: 'El documento no es legible',
        description: 'Razón del rechazo'
      }
    }
  },

  // ==================== RESPONSES ====================

  TaxResidencyCreatedResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              tax_residency_id: {
                type: 'string',
                format: 'uuid'
              },
              is_us_taxpayer: {
                type: 'boolean'
              },
              form_type: {
                type: 'string',
                enum: ['w8', 'w9', null],
                nullable: true
              },
              document_url: {
                type: 'string',
                format: 'uri',
                nullable: true
              },
              status: {
                type: 'string',
                enum: ['pending', 'approved']
              },
              created_at: {
                type: 'string',
                format: 'date-time'
              }
            }
          }
        }
      }
    ]
  },

  TaxResidencyDetailResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/TaxResidencyDetail'
          }
        }
      }
    ]
  },

  TaxResidencyListResponse: {
    allOf: [
      { $ref: '#/components/schemas/PaginatedResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/TaxResidencyList'
            }
          }
        }
      }
    ]
  },

  TaxResidencyStatsResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/TaxResidencyStats'
          }
        }
      }
    ]
  },

  TaxResidencyActionResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              tax_residency_id: {
                type: 'string',
                format: 'uuid'
              },
              status: {
                type: 'string'
              },
              message: {
                type: 'string'
              }
            }
          }
        }
      }
    ]
  }
};

module.exports = taxResidencySchemas;