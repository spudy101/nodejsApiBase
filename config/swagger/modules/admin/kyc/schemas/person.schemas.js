/**
 * ============================================================
 * PERSON SCHEMAS - Usando schemas compartidos (formato snake_case)
 * ============================================================
 * Schemas para la documentación Swagger del módulo de admin
 * Usa schemas compartidos pero adaptados a formato snake_case
 */

const personSchemas = {
  
  // ============================================================
  // REQUEST SCHEMAS
  // ============================================================

  CreateUserRequest: {
    type: 'object',
    required: ['nationalId', 'email', 'firstName', 'lastName', 'roleId'],
    properties: {
      nationalId: {
        type: 'string',
        minLength: 5,
        maxLength: 50,
        example: '12345678-9',
        description: 'Número de identificación nacional del usuario'
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 255,
        example: 'usuario@example.com',
        description: 'Correo electrónico del usuario'
      },
      firstName: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        example: 'Juan',
        description: 'Nombre del usuario'
      },
      lastName: {
        type: 'string',
        minLength: 2,
        maxLength: 100,
        example: 'Pérez',
        description: 'Apellido del usuario'
      },
      roleId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del rol a asignar al usuario'
      },
      birthDate: {
        type: 'string',
        format: 'date',
        example: '1990-01-15',
        description: 'Fecha de nacimiento del usuario (opcional)'
      },
      genderId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174001',
        description: 'ID del género del usuario (opcional)'
      },
      countryId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174002',
        description: 'ID del país del usuario (opcional)'
      }
    }
  },

  ChangeEmailRequest: {
    type: 'object',
    required: ['newEmail'],
    properties: {
      newEmail: {
        type: 'string',
        format: 'email',
        maxLength: 255,
        example: 'nuevo.email@example.com',
        description: 'Nuevo correo electrónico del usuario'
      }
    }
  },

  ChangeNationalIdRequest: {
    type: 'object',
    required: ['newNationalId'],
    properties: {
      newNationalId: {
        type: 'string',
        minLength: 5,
        maxLength: 50,
        example: '98765432-1',
        description: 'Nuevo número de identificación nacional'
      }
    }
  },

  ChangeRoleRequest: {
    type: 'object',
    required: ['newRoleId'],
    properties: {
      newRoleId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174003',
        description: 'ID del nuevo rol a asignar'
      }
    }
  },

  DeleteAccountRequest: {
    type: 'object',
    required: ['currentPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        format: 'password',
        example: 'Admin123!',
        description: 'Contraseña actual del administrador para confirmar la eliminación'
      }
    }
  },

  // ============================================================
  // RESPONSE SCHEMAS - Formato snake_case (Admin)
  // ============================================================

  ContactResponse: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email', example: 'usuario@example.com' },
      email_verified_at: { type: 'string', format: 'date-time', nullable: true, example: '2024-01-17T10:30:00.000Z' },
      is_email_verified: { type: 'boolean', example: true },
      phone_primary: { type: 'string', nullable: true, example: '972408060' },
      phone_primary_verified_at: { type: 'string', format: 'date-time', nullable: true, example: '2024-01-17T10:30:00.000Z' },
      is_phone_primary_verified: { type: 'boolean', example: true },
      phone_secondary: { type: 'string', nullable: true, example: null },
      phone_secondary_verified_at: { type: 'string', format: 'date-time', nullable: true, example: null },
      is_phone_secondary_verified: { type: 'boolean', example: false },
      phone_primary_prefix: { type: 'string', nullable: true, example: '+56' },
      phone_secondary_prefix: { type: 'string', nullable: true, example: null },
      phone_primary_full: { type: 'string', nullable: true, example: '+56972408060' },
      phone_secondary_full: { type: 'string', nullable: true, example: null }
    }
  },

  LocationResponse: {
    type: 'object',
    properties: {
      address: { type: 'string', example: 'Av. Libertador 1234' },
      postal_code: { type: 'string', example: '8320000' },
      type: { type: 'string', example: 'casa' },
      country: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Chile' },
          code: { type: 'string', example: 'CL' },
          icon_url: { type: 'string', example: 'https://flagcdn.com/cl.svg' }
        }
      },
      city: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Santiago' }
        }
      },
      department: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Región Metropolitana' }
        }
      }
    }
  },

  GenderResponse: {
    type: 'object',
    properties: {
      gender_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174001' },
      name: { type: 'string', example: 'Masculino' }
    }
  },

  CountryResponse: {
    type: 'object',
    properties: {
      country_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174002' },
      name: { type: 'string', example: 'Chile' },
      code: { type: 'string', example: 'CL' },
      icon_url: { type: 'string', example: 'https://flagcdn.com/cl.svg' }
    }
  },

  RoleResponse: {
    type: 'object',
    properties: {
      role_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
      name: { type: 'string', example: 'admin' },
      description: { type: 'string', example: 'Administrador del sistema' }
    }
  },

  AvatarResponse: {
    type: 'object',
    properties: {
      avatar_id: { type: 'string', format: 'uuid', example: '99653c0a-a9cc-4603-99ad-8c8cc6b3ddf1' },
      url: { type: 'string', example: 'https://example.com/avatars/default.png' }
    }
  },

  PersonResponse: {
    type: 'object',
    properties: {
      person_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174004' },
      first_name: { type: 'string', example: 'Juan' },
      last_name: { type: 'string', example: 'Pérez' },
      full_name: { type: 'string', example: 'Juan Pérez' },
      national_id: { type: 'string', example: '12345678-9' },
      birth_date: { type: 'string', format: 'date', nullable: true, example: '1990-01-15' },
      gender_id: { type: 'string', format: 'uuid', nullable: true },
      country_id: { type: 'string', format: 'uuid', nullable: true },
      
      contact: { $ref: '#/components/schemas/ContactResponse' },
      location: { $ref: '#/components/schemas/LocationResponse' },
      gender: { $ref: '#/components/schemas/GenderResponse' },
      country: { $ref: '#/components/schemas/CountryResponse' },
      
      // Usando schemas compartidos adaptados a snake_case
      identity_validations: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            validation_id: { type: 'string', format: 'uuid' },
            status: { type: 'string', enum: ['pending', 'signed', 'cancelled', 'failed', 'expired'] },
            zapsign_document_id: { type: 'string', nullable: true },
            document_url: { type: 'string', nullable: true },
            initiated_at: { type: 'string', format: 'date-time' },
            completed_at: { type: 'string', format: 'date-time', nullable: true },
            attempts: { type: 'integer' },
            last_attempt_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        }
      },
      
      screenings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            screening_id: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            status: { type: 'string' },
            admin_action: { type: 'string', nullable: true },
            admin_notes: { type: 'string', nullable: true },
            pep_flag: { type: 'boolean' },
            initial_answers: { type: 'object', nullable: true },
            reviewed_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            reviewer: { type: 'object', nullable: true },
            details: { type: 'array', items: { type: 'object' } }
          }
        }
      },
      
      employment_records: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            employment_record_id: { type: 'string', format: 'uuid' },
            employment_type: { type: 'string' },
            company_name: { type: 'string', nullable: true },
            is_employed: { type: 'boolean' },
            monthly_salary: { type: 'string', nullable: true },
            status: { type: 'string' },
            rejection_reason: { type: 'string', nullable: true },
            approved_at: { type: 'string', format: 'date-time', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
            reviewer: { type: 'object', nullable: true },
            documents: { type: 'array', items: { type: 'object' } },
            reviews: { type: 'array', items: { type: 'object' } }
          }
        }
      },
      
      tax_residencies: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            tax_residency_id: { type: 'string', format: 'uuid' },
            is_us_taxpayer: { type: 'boolean' },
            status: { type: 'string' },
            // ... más campos
          }
        }
      },
      
      credit_report: {
        type: 'object',
        properties: {
          credit_report_id: { type: 'string', format: 'uuid' },
          zapier_relation_id: { type: 'string' },
          pdf_url: { type: 'string', nullable: true },
          score: { type: 'integer', nullable: true },
          score_range: { type: 'string', nullable: true },
          risk_category: { type: 'string' },
          recommendation: { type: 'string', nullable: true },
          status: { type: 'string' },
          raw_data: { type: 'object', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      }
    }
  },

  // ============================================================
  // MAIN RESPONSE SCHEMAS
  // ============================================================

  UserResponse: {
    type: 'object',
    properties: {
      user_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174005' },
      username: { type: 'string', example: '12345678-9' },
      is_active: { type: 'boolean', example: true },
      totp_enabled: { type: 'boolean', example: false },
      createdAt: { type: 'string', format: 'date-time', example: '2024-01-17T10:30:00.000Z' },
      updatedAt: { type: 'string', format: 'date-time', example: '2024-01-17T10:30:00.000Z' },
      person: { $ref: '#/components/schemas/PersonResponse' },
      role: { $ref: '#/components/schemas/RoleResponse' },
      avatar: { $ref: '#/components/schemas/AvatarResponse' }
    }
  },

  UserListItemResponse: {
    type: 'object',
    properties: {
      user_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174005' },
      username: { type: 'string', example: '12345678-9' },
      is_active: { type: 'boolean', example: true },
      totp_enabled: { type: 'boolean', example: false },
      createdAt: { type: 'string', format: 'date-time', example: '2024-01-17T10:30:00.000Z' },
      person: {
        type: 'object',
        properties: {
          first_name: { type: 'string', example: 'Juan' },
          last_name: { type: 'string', example: 'Pérez' },
          national_id: { type: 'string', example: '12345678-9' }
        }
      },
      email: { type: 'string', format: 'email', example: 'usuario@example.com' },
      email_verified: { type: 'boolean', example: true },
      role: {
        type: 'object',
        properties: {
          role_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
          name: { type: 'string', example: 'admin' }
        }
      }
    }
  },

  CreateUserResponse: {
    type: 'object',
    properties: {
      user: { $ref: '#/components/schemas/UserResponse' },
      temporaryPassword: { type: 'string', example: 'TempPass123!', description: 'Contraseña temporal generada para el usuario' }
    }
  },

  ResetPasswordResponse: {
    type: 'object',
    properties: {
      user_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174005' },
      username: { type: 'string', example: '12345678-9' },
      email: { type: 'string', format: 'email', example: 'usuario@example.com' }
    }
  },

  ChangeEmailResponse: {
    type: 'object',
    properties: {
      user_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174005' },
      username: { type: 'string', example: '12345678-9' },
      old_email: { type: 'string', format: 'email', example: 'viejo@example.com' },
      new_email: { type: 'string', format: 'email', example: 'nuevo@example.com' },
      email_verified: { type: 'boolean', example: true }
    }
  },

  ChangeNationalIdResponse: {
    type: 'object',
    properties: {
      user_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174005' },
      username: { type: 'string', example: '98765432-1' },
      old_national_id: { type: 'string', example: '12345678-9' },
      new_national_id: { type: 'string', example: '98765432-1' }
    }
  },

  ToggleUserStatusResponse: {
    type: 'object',
    properties: {
      user_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174005' },
      username: { type: 'string', example: '12345678-9' },
      is_active: { type: 'boolean', example: true }
    }
  },

  DisableMFAResponse: {
    type: 'object',
    properties: {
      user_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174005' },
      username: { type: 'string', example: '12345678-9' },
      totp_enabled: { type: 'boolean', example: false }
    }
  },

  ChangeRoleResponse: {
    type: 'object',
    properties: {
      user_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174005' },
      username: { type: 'string', example: '12345678-9' },
      old_role: {
        type: 'object',
        properties: {
          role_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' },
          name: { type: 'string', example: 'user' }
        }
      },
      new_role: {
        type: 'object',
        properties: {
          role_id: { type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174003' },
          name: { type: 'string', example: 'admin' }
        }
      }
    }
  },

  // ============================================================
  // SUCCESS RESPONSES USANDO COMMON SCHEMAS
  // ============================================================

  UserSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/UserResponse' }
        }
      }
    ]
  },

  UserListSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: '#/components/schemas/UserListItemResponse' }
          },
          metadata: { $ref: '#/components/schemas/CompleteMetadata' }
        }
      }
    ]
  },

  CreateUserSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/CreateUserResponse' }
        }
      }
    ]
  },

  ResetPasswordSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/ResetPasswordResponse' }
        }
      }
    ]
  },

  ChangeEmailSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/ChangeEmailResponse' }
        }
      }
    ]
  },

  ChangeNationalIdSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/ChangeNationalIdResponse' }
        }
      }
    ]
  },

  ToggleUserStatusSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/ToggleUserStatusResponse' }
        }
      }
    ]
  },

  DisableMFASuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/DisableMFAResponse' }
        }
      }
    ]
  },

  ChangeRoleSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/ChangeRoleResponse' }
        }
      }
    ]
  },

  DeleteAccountSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'null',
            example: null,
            description: 'Sin datos de retorno para operación de eliminación'
          }
        }
      }
    ]
  }
};

module.exports = personSchemas;