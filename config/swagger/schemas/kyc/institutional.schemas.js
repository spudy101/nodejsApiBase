/**
 * Schemas para módulo de Instituciones y Correos Institucionales
 * Incluye schemas para admin y cliente
 */

const institutionalSchemas = {
  // ==================== INSTITUTION SCHEMAS ====================

  Institution: {
    type: 'object',
    required: ['institution_id', 'name', 'has_agreement', 'created_at', 'updated_at'],
    properties: {
      institution_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único de la institución'
      },
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 255,
        example: 'Universidad Nacional',
        description: 'Nombre de la institución educativa'
      },
      has_agreement: {
        type: 'boolean',
        example: true,
        description: 'Indica si tiene convenio con la plataforma'
      },
      transfer_data: {
        type: 'object',
        nullable: true,
        example: {
          bank: 'Banco Estado',
          account_number: '123456789',
          account_type: 'Cuenta Corriente',
          rut: '12.345.678-9'
        },
        description: 'Datos de transferencia (solo si tiene convenio)'
      },
      report_email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'informes@universidad.edu',
        description: 'Correo para enviar informes (solo si tiene convenio)'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T10:00:00.000Z',
        description: 'Fecha de creación'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T10:00:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  InstitutionSimple: {
    type: 'object',
    required: ['institution_id', 'name', 'has_agreement'],
    properties: {
      institution_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único de la institución'
      },
      name: {
        type: 'string',
        example: 'Universidad Nacional',
        description: 'Nombre de la institución educativa'
      },
      has_agreement: {
        type: 'boolean',
        example: true,
        description: 'Indica si tiene convenio con la plataforma'
      }
    }
  },

  InstitutionList: {
    type: 'object',
    required: ['institution_id', 'name', 'has_agreement', 'created_at', 'updated_at'],
    properties: {
      institution_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único de la institución'
      },
      name: {
        type: 'string',
        example: 'Universidad Nacional',
        description: 'Nombre de la institución educativa'
      },
      has_agreement: {
        type: 'boolean',
        example: true,
        description: 'Indica si tiene convenio con la plataforma'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T10:00:00.000Z',
        description: 'Fecha de creación'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T10:00:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  InstitutionCreateRequest: {
    type: 'object',
    required: ['name', 'has_agreement'],
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 255,
        example: 'Universidad Nacional',
        description: 'Nombre de la institución educativa'
      },
      has_agreement: {
        type: 'boolean',
        example: true,
        description: 'Indica si tiene convenio con la plataforma'
      },
      transfer_data: {
        type: 'object',
        nullable: true,
        example: {
          bank: 'Banco Estado',
          account_number: '123456789',
          account_type: 'Cuenta Corriente',
          rut: '12.345.678-9'
        },
        description: 'Datos de transferencia (requerido si has_agreement es true)'
      },
      report_email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'informes@universidad.edu',
        description: 'Correo para informes (requerido si has_agreement es true)'
      }
    }
  },

  InstitutionUpdateRequest: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        minLength: 3,
        maxLength: 255,
        example: 'Universidad Nacional',
        description: 'Nombre de la institución educativa'
      },
      has_agreement: {
        type: 'boolean',
        example: true,
        description: 'Indica si tiene convenio con la plataforma'
      },
      transfer_data: {
        type: 'object',
        nullable: true,
        example: {
          bank: 'Banco Estado',
          account_number: '987654321'
        },
        description: 'Datos de transferencia (requerido si has_agreement es true)'
      },
      report_email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'reportes@universidad.edu',
        description: 'Correo para informes (requerido si has_agreement es true)'
      }
    }
  },

  InstitutionCreatedResponse: {
    type: 'object',
    required: ['institution_id', 'name', 'has_agreement', 'created_at', 'message'],
    properties: {
      institution_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      name: {
        type: 'string',
        example: 'Universidad Nacional'
      },
      has_agreement: {
        type: 'boolean',
        example: true
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T10:00:00.000Z'
      },
      message: {
        type: 'string',
        example: 'Institución creada exitosamente'
      }
    }
  },

  InstitutionUpdatedResponse: {
    type: 'object',
    required: ['institution_id', 'name', 'has_agreement', 'updated_at', 'message'],
    properties: {
      institution_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      name: {
        type: 'string',
        example: 'Universidad Nacional'
      },
      has_agreement: {
        type: 'boolean',
        example: true
      },
      transfer_data: {
        type: 'object',
        nullable: true,
        example: {
          bank: 'Banco Estado',
          account_number: '987654321'
        }
      },
      report_email: {
        type: 'string',
        format: 'email',
        nullable: true,
        example: 'reportes@universidad.edu'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T12:00:00.000Z'
      },
      message: {
        type: 'string',
        example: 'Institución actualizada exitosamente'
      }
    }
  },

  // ==================== INSTITUTIONAL EMAIL SCHEMAS ====================

  InstitutionalEmail: {
    type: 'object',
    required: ['institutional_email_id', 'email', 'validated_at', 'expires_at', 'is_active', 'created_at', 'updated_at'],
    properties: {
      institutional_email_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único del correo institucional'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'juan.perez@universidad.edu',
        description: 'Correo institucional del usuario'
      },
      validated_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T10:00:00.000Z',
        description: 'Fecha de validación'
      },
      expires_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-02T10:00:00.000Z',
        description: 'Fecha de expiración (6 meses después de validated_at)'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si la validación está activa'
      },
      institution: {
        $ref: '#/components/schemas/InstitutionSimple'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T10:00:00.000Z',
        description: 'Fecha de creación'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T10:00:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  InstitutionalEmailValidateRequest: {
    type: 'object',
    required: ['email', 'institution_id'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'juan.perez@universidad.edu',
        description: 'Correo institucional del usuario'
      },
      institution_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la institución a la que pertenece'
      }
    }
  },

  InstitutionalEmailValidatedResponse: {
    type: 'object',
    required: ['institutional_email_id', 'email', 'validated_at', 'expires_at', 'is_active', 'institution', 'message'],
    properties: {
      institutional_email_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'juan.perez@universidad.edu'
      },
      validated_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T10:00:00.000Z'
      },
      expires_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-08-02T10:00:00.000Z'
      },
      is_active: {
        type: 'boolean',
        example: true
      },
      institution: {
        $ref: '#/components/schemas/InstitutionSimple'
      },
      message: {
        type: 'string',
        example: 'Correo institucional validado exitosamente. Válido por 6 meses.'
      }
    }
  }
};

module.exports = institutionalSchemas;