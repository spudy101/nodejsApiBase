/**
 * ============================================================
 * PROFILE SCHEMAS - Usando schemas compartidos
 * ============================================================
 * Schemas para la documentación Swagger del módulo de perfil
 * Ahora usa schemas compartidos para evitar duplicación
 */

const profileSchemas = {
  
  // ============================================================
  // REQUEST SCHEMAS
  // ============================================================

  UpdateLocationRequest: {
    type: 'object',
    required: ['address', 'cityId', 'departmentId', 'countryId'],
    properties: {
      address: {
        type: 'string',
        example: 'Av. Libertador 1234',
        description: 'Dirección completa'
      },
      postalCode: {
        type: 'string',
        example: '8320000',
        description: 'Código postal (opcional)'
      },
      type: {
        type: 'string',
        enum: ['casa', 'apartamento', 'oficina', 'otro'],
        example: 'casa',
        description: 'Tipo de ubicación (opcional)'
      },
      cityId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      departmentId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174001'
      },
      countryId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174002'
      }
    }
  },

  UpdateEmailRequest: {
    type: 'object',
    required: ['newEmail'],
    properties: {
      newEmail: {
        type: 'string',
        format: 'email',
        example: 'nuevo.email@example.com',
        description: 'Nuevo correo electrónico'
      }
    }
  },

  UpdatePhoneRequest: {
    type: 'object',
    required: ['phoneType', 'newPhone', 'prefixId'],
    properties: {
      phoneType: {
        type: 'string',
        enum: ['primary', 'secondary'],
        example: 'primary',
        description: 'Tipo de teléfono a actualizar'
      },
      newPhone: {
        type: 'string',
        example: '987654321',
        description: 'Nuevo número de teléfono (sin prefijo)'
      },
      prefixId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174003',
        description: 'ID del prefijo telefónico'
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

  // ============================================================
  // RESPONSE SCHEMAS - Usando schemas compartidos
  // ============================================================

  BasicProfileResponse: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        format: 'uuid',
        example: '7adf648b-e438-4219-916f-23fefd731f78'
      },
      username: {
        type: 'string',
        example: '21028507-5'
      },
      isActive: {
        type: 'boolean',
        example: true
      },
      mfaEnabled: {
        type: 'boolean',
        example: false
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-01-15T10:30:00.000Z'
      },
      
      // Referencias a schemas compartidos
      person: { $ref: '#/components/schemas/PersonBase' },
      contact: { $ref: '#/components/schemas/Contact' },
      location: { $ref: '#/components/schemas/Location' },
      role: { $ref: '#/components/schemas/Role' },
      avatar: { $ref: '#/components/schemas/Avatar' },
      account: { $ref: '#/components/schemas/Account' },
      
      creditReport: { $ref: '#/components/schemas/CreditReport' },
      
      employmentRecords: {
        type: 'array',
        items: { $ref: '#/components/schemas/EmploymentRecord' }
      },
      
      screenings: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            screeningId: { type: 'string', format: 'uuid' },
            type: { type: 'string' },
            status: { type: 'string' },
            adminAction: { type: 'string', nullable: true },
            pepFlag: { type: 'boolean' },
            reviewedAt: { type: 'string', format: 'date-time', nullable: true }
          }
        }
      }
    }
  },

  ExtendedProfileResponse: {
    allOf: [
      { $ref: '#/components/schemas/BasicProfileResponse' },
      {
        type: 'object',
        properties: {
          identityValidations: {
            type: 'array',
            items: { $ref: '#/components/schemas/IdentityValidation' }
          },
          
          screenings: {
            type: 'array',
            items: { $ref: '#/components/schemas/Screening' }
          },
          
          employmentRecords: {
            type: 'array',
            items: { $ref: '#/components/schemas/EmploymentRecord' }
          },
          
          taxResidencies: {
            type: 'array',
            items: { $ref: '#/components/schemas/TaxResidency' }
          },
          
          creditReport: { $ref: '#/components/schemas/CreditReportDetailed' }
        }
      }
    ]
  },

  UpdateLocationResponse: {
    type: 'object',
    properties: {
      location: { $ref: '#/components/schemas/Location' }
    }
  },

  ContactInfoResponse: {
    type: 'object',
    properties: {
      contact: { $ref: '#/components/schemas/Contact' }
    }
  },

  UpdateEmailResponse: {
    type: 'object',
    properties: {
      oldEmail: {
        type: 'string',
        format: 'email',
        example: 'viejo@example.com'
      },
      newEmail: {
        type: 'string',
        format: 'email',
        example: 'nuevo@example.com'
      },
      emailVerified: {
        type: 'boolean',
        example: true
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-02-02T18:00:00.000Z'
      }
    }
  },

  UpdatePhoneResponse: {
    type: 'object',
    properties: {
      phoneType: {
        type: 'string',
        enum: ['primary', 'secondary'],
        example: 'primary'
      },
      oldPhone: {
        type: 'string',
        nullable: true,
        example: '987654321'
      },
      newPhone: {
        type: 'string',
        example: '912345678'
      },
      phoneVerified: {
        type: 'boolean',
        example: true
      },
      prefix: {
        type: 'string',
        nullable: true,
        example: '+56'
      },
      fullPhone: {
        type: 'string',
        nullable: true,
        example: '+56912345678'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-02-02T18:00:00.000Z'
      }
    }
  },

  ChangeNationalIdResponse: {
    type: 'object',
    properties: {
      personId: {
        type: 'string',
        format: 'uuid',
        example: '08b2307f-085c-402d-a5e0-32e90f62db48'
      },
      oldNationalId: {
        type: 'string',
        example: '12345678-9'
      },
      newNationalId: {
        type: 'string',
        example: '98765432-1'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2026-02-02T18:00:00.000Z'
      }
    }
  },

  // ============================================================
  // SUCCESS RESPONSES usando COMMON SCHEMAS
  // ============================================================

  BasicProfileSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/BasicProfileResponse' }
        }
      }
    ]
  },

  ExtendedProfileSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/ExtendedProfileResponse' }
        }
      }
    ]
  },

  UpdateLocationSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/UpdateLocationResponse' }
        }
      }
    ]
  },

  ContactInfoSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/ContactInfoResponse' }
        }
      }
    ]
  },

  UpdateEmailSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/UpdateEmailResponse' }
        }
      }
    ]
  },

  UpdatePhoneSuccessResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: { $ref: '#/components/schemas/UpdatePhoneResponse' }
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

  UpdateProfileRequest: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 50,
        example: 'nuevo_usuario123',
        description: 'Nuevo username (opcional)'
      },
      avatar_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del avatar (opcional)'
      },
      gender_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174001',
        description: 'ID del género (opcional)'
      },
      location: {
        type: 'object',
        properties: {
          country_id: { type: 'string', format: 'uuid' },
          department_id: { type: 'string', format: 'uuid' },
          city_id: { type: 'string', format: 'uuid' },
          address: { type: 'string' },
          postal_code: { type: 'string' },
          type: { type: 'string', enum: ['casa', 'apartamento', 'oficina', 'otro'] }
        },
        description: 'Información de ubicación (opcional)'
      }
    }
  },

  LocationResponse: {
    type: 'object',
    properties: {
      location: { $ref: '#/components/schemas/Location' }
    }
  },

  UpdatePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        format: 'password',
        example: 'OldPass123!',
        description: 'Contraseña actual'
      },
      newPassword: {
        type: 'string',
        format: 'password',
        minLength: 8,
        example: 'NewPass456!',
        description: 'Nueva contraseña'
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
        example: 'MyPass123!',
        description: 'Contraseña actual para confirmar eliminación'
      }
    }
  }
};

module.exports = profileSchemas;