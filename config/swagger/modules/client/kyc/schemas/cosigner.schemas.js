/**
 * Schemas para el módulo de Cosigner (Invitaciones y Relaciones Deudor-Codeudor)
 * Uso: Importar en tu configuración de Swagger
 */

const cosignerSchemas = {
  // ==================== PERSON NESTED ====================

  PersonNested: {
    type: 'object',
    required: ['person_id', 'first_name', 'last_name'],
    properties: {
      person_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único de la persona'
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
        description: 'RUT o cédula nacional'
      }
    }
  },

  // ==================== COSIGNER INVITATION SCHEMAS ====================

  CosignerInvitation: {
    type: 'object',
    required: [
      'cosigner_invitation_id',
      'invitation_code',
      'status',
      'expires_at',
      'created_at'
    ],
    properties: {
      cosigner_invitation_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único de la invitación'
      },
      invitation_code: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        example: '123456',
        description: 'Código de invitación de 6 dígitos'
      },
      status: {
        type: 'string',
        enum: ['pendiente', 'usado', 'expirado'],
        example: 'pendiente',
        description: 'Estado de la invitación'
      },
      expires_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-03T12:00:00.000Z',
        description: 'Fecha de expiración (24 horas después de creación)'
      },
      used_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2025-02-02T14:30:00.000Z',
        description: 'Fecha cuando se usó el código'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T12:00:00.000Z',
        description: 'Fecha de creación'
      },
      cosigner: {
        $ref: '#/components/schemas/PersonNested',
        description: 'Persona que generó la invitación (codeudor)'
      },
      debtor: {
        allOf: [
          { $ref: '#/components/schemas/PersonNested' },
          { nullable: true }
        ],
        description: 'Persona que usó el código (deudor)'
      }
    }
  },

  CosignerInvitationDetail: {
    allOf: [
      { $ref: '#/components/schemas/CosignerInvitation' },
      {
        type: 'object',
        properties: {
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-02-02T12:00:00.000Z',
            description: 'Fecha de última actualización'
          },
          debtor_cosigner: {
            type: 'object',
            nullable: true,
            properties: {
              debtor_cosigner_id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000',
                description: 'ID de la relación creada'
              },
              status: {
                type: 'string',
                enum: ['activo', 'inactivo'],
                example: 'activo',
                description: 'Estado de la relación'
              },
              linked_at: {
                type: 'string',
                format: 'date-time',
                example: '2025-02-02T14:30:00.000Z',
                description: 'Fecha de vinculación'
              }
            },
            description: 'Relación deudor-codeudor creada (si fue usada)'
          }
        }
      }
    ]
  },

  InvitationCodeGenerated: {
    type: 'object',
    required: [
      'cosigner_invitation_id',
      'invitation_code',
      'status',
      'expires_at',
      'created_at'
    ],
    properties: {
      cosigner_invitation_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único de la invitación'
      },
      invitation_code: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        example: '123456',
        description: 'Código de invitación generado'
      },
      status: {
        type: 'string',
        enum: ['pendiente'],
        example: 'pendiente',
        description: 'Estado inicial de la invitación'
      },
      expires_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-03T12:00:00.000Z',
        description: 'Fecha de expiración (24 horas)'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T12:00:00.000Z',
        description: 'Fecha de creación'
      }
    }
  },

  // ==================== DEBTOR COSIGNER SCHEMAS ====================

  DebtorCosigner: {
    type: 'object',
    required: [
      'debtor_cosigner_id',
      'status',
      'linked_at'
    ],
    properties: {
      debtor_cosigner_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único de la relación'
      },
      status: {
        type: 'string',
        enum: ['activo', 'inactivo'],
        example: 'activo',
        description: 'Estado de la relación'
      },
      linked_at: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-02T14:30:00.000Z',
        description: 'Fecha de vinculación'
      },
      unlinked_at: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2025-02-10T10:00:00.000Z',
        description: 'Fecha de desvinculación'
      },
      debtor: {
        $ref: '#/components/schemas/PersonNested',
        description: 'Deudor principal'
      },
      cosigner: {
        $ref: '#/components/schemas/PersonNested',
        description: 'Codeudor vinculado'
      },
      unlinked_by: {
        allOf: [
          { $ref: '#/components/schemas/PersonNested' },
          { nullable: true }
        ],
        description: 'Persona que desvinculó la relación'
      }
    }
  },

  DebtorCosignerDetail: {
    allOf: [
      { $ref: '#/components/schemas/DebtorCosigner' },
      {
        type: 'object',
        properties: {
          created_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-02-02T14:30:00.000Z',
            description: 'Fecha de creación'
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-02-02T14:30:00.000Z',
            description: 'Fecha de última actualización'
          },
          invitation: {
            type: 'object',
            nullable: true,
            properties: {
              cosigner_invitation_id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000',
                description: 'ID de la invitación original'
              },
              invitation_code: {
                type: 'string',
                example: '123456',
                description: 'Código de invitación usado'
              },
              created_at: {
                type: 'string',
                format: 'date-time',
                example: '2025-02-02T12:00:00.000Z',
                description: 'Fecha de creación de la invitación'
              }
            },
            description: 'Invitación que originó la relación'
          }
        }
      }
    ]
  },

  CodeUsedResponse: {
    type: 'object',
    required: ['message', 'invitation', 'debtor_cosigner'],
    properties: {
      message: {
        type: 'string',
        example: 'Código usado exitosamente',
        description: 'Mensaje de confirmación'
      },
      invitation: {
        type: 'object',
        required: ['cosigner_invitation_id', 'invitation_code', 'used_at'],
        properties: {
          cosigner_invitation_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
            description: 'ID de la invitación'
          },
          invitation_code: {
            type: 'string',
            example: '123456',
            description: 'Código usado'
          },
          used_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-02-02T14:30:00.000Z',
            description: 'Fecha de uso'
          }
        }
      },
      debtor_cosigner: {
        type: 'object',
        required: ['debtor_cosigner_id', 'status', 'linked_at'],
        properties: {
          debtor_cosigner_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
            description: 'ID de la relación creada'
          },
          status: {
            type: 'string',
            enum: ['activo'],
            example: 'activo',
            description: 'Estado de la relación'
          },
          linked_at: {
            type: 'string',
            format: 'date-time',
            example: '2025-02-02T14:30:00.000Z',
            description: 'Fecha de vinculación'
          }
        }
      },
      cosigner: {
        $ref: '#/components/schemas/PersonNested',
        description: 'Codeudor vinculado'
      }
    }
  },

  UnlinkResponse: {
    type: 'object',
    required: ['message', 'debtor_cosigner_id'],
    properties: {
      message: {
        type: 'string',
        example: 'Relación desvinculada exitosamente',
        description: 'Mensaje de confirmación'
      },
      debtor_cosigner_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la relación desvinculada'
      }
    }
  },

  // ==================== REQUEST BODIES ====================

  UseCodeRequest: {
    type: 'object',
    required: ['invitation_code'],
    properties: {
      invitation_code: {
        type: 'string',
        pattern: '^[0-9]{6}$',
        minLength: 6,
        maxLength: 6,
        example: '123456',
        description: 'Código de invitación de 6 dígitos'
      }
    }
  }
};

module.exports = cosignerSchemas;