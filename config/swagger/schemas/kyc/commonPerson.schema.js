/**
 * ============================================================
 * SHARED SCHEMAS - Schemas compartidos
 * ============================================================
 * Schemas que pueden ser reutilizados tanto en:
 * - profile_schemas.js (perfil de usuario)
 * - person_schemas.js (admin gestión de usuarios)
 */

const sharedSchemas = {
  
  // ============================================================
  // PERSON & CONTACT SCHEMAS
  // ============================================================

  PersonBase: {
    type: 'object',
    properties: {
      personId: {
        type: 'string',
        format: 'uuid',
        example: '08b2307f-085c-402d-a5e0-32e90f62db48'
      },
      firstName: {
        type: 'string',
        example: 'Juan'
      },
      lastName: {
        type: 'string',
        example: 'Pérez'
      },
      fullName: {
        type: 'string',
        example: 'Juan Pérez'
      },
      nationalId: {
        type: 'string',
        example: '12345678-9'
      },
      birthDate: {
        type: 'string',
        format: 'date',
        nullable: true,
        example: '1990-01-15'
      },
      genderId: {
        type: 'string',
        format: 'uuid',
        nullable: true,
        example: 'a05b1555-592f-4d66-9013-6f5ab48a8233'
      },
      countryId: {
        type: 'string',
        format: 'uuid',
        nullable: true,
        example: '9fa50c24-c239-4d7a-830c-e4672904db90'
      }
    }
  },

  Contact: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'usuario@example.com'
      },
      emailVerifiedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2026-01-18T07:16:09.552Z'
      },
      isEmailVerified: {
        type: 'boolean',
        example: true
      },
      phonePrimary: {
        type: 'string',
        nullable: true,
        example: '972408060'
      },
      phonePrimaryVerifiedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2026-01-22T13:13:58.307Z'
      },
      isPhonePrimaryVerified: {
        type: 'boolean',
        example: true
      },
      phoneSecondary: {
        type: 'string',
        nullable: true,
        example: null
      },
      phoneSecondaryVerifiedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null
      },
      isPhoneSecondaryVerified: {
        type: 'boolean',
        example: false
      },
      phonePrimaryPrefix: {
        type: 'string',
        nullable: true,
        example: '+56'
      },
      phoneSecondaryPrefix: {
        type: 'string',
        nullable: true,
        example: null
      },
      phonePrimaryFull: {
        type: 'string',
        nullable: true,
        example: '+56972408060'
      },
      phoneSecondaryFull: {
        type: 'string',
        nullable: true,
        example: null
      }
    }
  },

  Location: {
    type: 'object',
    properties: {
      address: {
        type: 'string',
        example: 'Av. Libertador 1234'
      },
      postalCode: {
        type: 'string',
        example: '8320000'
      },
      type: {
        type: 'string',
        example: 'residencial'
      },
      country: {
        type: 'object',
        properties: {
          name: { type: 'string', example: 'Chile' },
          code: { type: 'string', example: 'CL' },
          iconUrl: { type: 'string', example: 'https://flagcdn.com/cl.svg' }
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

  Gender: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Masculino'
      }
    }
  },

  Country: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        example: 'Chile'
      },
      code: {
        type: 'string',
        example: 'CL'
      },
      iconUrl: {
        type: 'string',
        example: 'https://flagcdn.com/cl.svg'
      }
    }
  },

  Role: {
    type: 'object',
    properties: {
      roleId: {
        type: 'string',
        format: 'uuid',
        example: '55ccdff0-af63-4c35-835a-b18215537b8a'
      },
      name: {
        type: 'string',
        example: 'user'
      },
      description: {
        type: 'string',
        example: 'Usuario regular del sistema'
      }
    }
  },

  Avatar: {
    type: 'object',
    properties: {
      avatarId: {
        type: 'string',
        format: 'uuid',
        example: '99653c0a-a9cc-4603-99ad-8c8cc6b3ddf1'
      },
      imageUrl: {
        type: 'string',
        example: 'https://example.com/avatars/default.png'
      }
    }
  },

  Account: {
    type: 'object',
    properties: {
      accountId: {
        type: 'string',
        format: 'uuid',
        example: '99653c0a-a9cc-4603-99ad-8c8cc6b3ddf1'
      },
      accountNumber: {
        type: 'string',
        example: 'ACC-1771516675472-L3KQ'
      },
      balance: {
        type: 'integer',
        example: 0
      },
      currency: {
        type: 'string',
        example: 'CLP'
      },
      status: {
        type: 'string',
        enum: ['active', 'suspended', 'closed'],
        example: 'active'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-18T10:30:00.000Z'
      },
    }
  },

  Reviewer: {
    type: 'object',
    nullable: true,
    properties: {
      personId: {
        type: 'string',
        format: 'uuid',
        example: '220e8400-e29b-41d4-a716-446655440012'
      },
      firstName: {
        type: 'string',
        example: 'María'
      },
      lastName: {
        type: 'string',
        example: 'González'
      },
      fullName: {
        type: 'string',
        example: 'María González'
      }
    }
  },

  // ============================================================
  // IDENTITY VALIDATION
  // ============================================================

  IdentityValidation: {
    type: 'object',
    properties: {
      validationId: {
        type: 'string',
        format: 'uuid',
        example: '110e8400-e29b-41d4-a716-446655440011'
      },
      status: {
        type: 'string',
        enum: ['pending', 'signed', 'cancelled', 'failed', 'expired'],
        example: 'signed'
      },
      zapsignDocumentId: {
        type: 'string',
        nullable: true,
        example: 'doc_123456'
      },
      documentUrl: {
        type: 'string',
        nullable: true,
        example: 'https://zapsign.example.com/document/123'
      },
      initiatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-18T10:30:00.000Z'
      },
      completedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-18T11:00:00.000Z'
      },
      attempts: {
        type: 'integer',
        example: 1
      },
      lastAttemptAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-18T11:00:00.000Z'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-18T10:30:00.000Z'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-18T11:00:00.000Z'
      }
    }
  },

  // ============================================================
  // SCREENING
  // ============================================================

  ScreeningDetail: {
    type: 'object',
    properties: {
      screeningDetailId: {
        type: 'string',
        format: 'uuid',
        example: '330e8400-e29b-41d4-a716-446655440013'
      },
      type: {
        type: 'string',
        enum: ['pep', 'sanctions', 'adverse_media'],
        example: 'pep'
      },
      zapierRelationId: {
        type: 'string',
        example: 'zap_123456789'
      },
      pdfUrl: {
        type: 'string',
        nullable: true,
        example: 'https://zapier.example.com/pep_report_123.pdf'
      },
      hasAlert: {
        type: 'boolean',
        example: true
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-18T12:05:00.000Z'
      }
    }
  },

  Screening: {
    type: 'object',
    properties: {
      screeningId: {
        type: 'string',
        format: 'uuid',
        example: 'f996ebb2-8f77-4748-9e89-f3c6da134aa6'
      },
      type: {
        type: 'string',
        enum: ['initial_questions', 'monthly_review'],
        example: 'initial_questions'
      },
      status: {
        type: 'string',
        enum: ['pending', 'completed', 'failed'],
        example: 'completed'
      },
      adminAction: {
        type: 'string',
        enum: ['mark_dangerous', 'false_positive', 'approve_with_pep_flag', 'retry', 'dismiss'],
        nullable: true,
        example: 'approve_with_pep_flag'
      },
      adminNotes: {
        type: 'string',
        nullable: true,
        example: 'Cliente identificado como PEP por cargo público familiar'
      },
      pepFlag: {
        type: 'boolean',
        example: true
      },
      initialAnswers: {
        type: 'object',
        nullable: true,
        example: {
          is_pep: true,
          has_sanctions: false,
          has_adverse_media: false
        }
      },
      reviewedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-20T16:00:00.000Z'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-18T12:00:00.000Z'
      },
      reviewer: {
        $ref: '#/components/schemas/Reviewer'
      },
      details: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ScreeningDetail'
        }
      }
    }
  },

  // ============================================================
  // EMPLOYMENT
  // ============================================================

  EmploymentDocument: {
    type: 'object',
    properties: {
      employmentDocumentId: {
        type: 'string',
        format: 'uuid',
        example: 'bb0e8400-e29b-41d4-a716-446655440006'
      },
      documentType: {
        type: 'string',
        enum: ['contrato', 'liquidacion', 'boleta'],
        example: 'contrato'
      },
      fileUrl: {
        type: 'string',
        example: 'https://s3.example.com/employment/contrato_123.pdf'
      },
      fileName: {
        type: 'string',
        example: 'contrato_trabajo.pdf'
      },
      fileSize: {
        type: 'integer',
        example: 245678
      },
      uploadedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-06-10T10:00:00.000Z'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-06-10T10:00:00.000Z'
      }
    }
  },

  EmploymentReview: {
    type: 'object',
    properties: {
      employmentReviewId: {
        type: 'string',
        format: 'uuid',
        example: '660e8400-e29b-41d4-a716-446655440016'
      },
      action: {
        type: 'string',
        enum: ['aprobar', 'rechazar', 'solicitar_renovacion'],
        example: 'aprobar'
      },
      reason: {
        type: 'string',
        nullable: true,
        example: 'Documentación completa y verificada'
      },
      previousStatus: {
        type: 'string',
        nullable: true,
        example: 'pendiente'
      },
      newStatus: {
        type: 'string',
        example: 'aprobado'
      },
      reviewedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-06-15T14:30:00.000Z'
      },
      reviewer: {
        $ref: '#/components/schemas/Reviewer'
      }
    }
  },

  EmploymentRecord: {
    type: 'object',
    properties: {
      employmentRecordId: {
        type: 'string',
        format: 'uuid',
        example: 'aa0e8400-e29b-41d4-a716-446655440005'
      },
      employmentType: {
        type: 'string',
        enum: ['dependiente', 'independiente'],
        example: 'dependiente'
      },
      companyName: {
        type: 'string',
        nullable: true,
        example: 'Tech Corp S.A.'
      },
      isEmployed: {
        type: 'boolean',
        example: true
      },
      monthlySalary: {
        type: 'string',
        nullable: true,
        example: '2500000.00'
      },
      status: {
        type: 'string',
        enum: ['pendiente', 'aprobado', 'rechazado', 'requiere_renovacion', 'pendiente_renovacion', 'expirado', 'dado_de_baja'],
        example: 'aprobado'
      },
      rejectionReason: {
        type: 'string',
        nullable: true,
        example: null
      },
      approvedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-06-15T14:30:00.000Z'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-06-10T09:00:00.000Z'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-06-15T14:30:00.000Z'
      },
      reviewer: {
        $ref: '#/components/schemas/Reviewer'
      },
      documents: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/EmploymentDocument'
        }
      },
      reviews: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/EmploymentReview'
        }
      }
    }
  },

  // ============================================================
  // TAX RESIDENCY
  // ============================================================

  TaxResidency: {
    type: 'object',
    properties: {
      taxResidencyId: {
        type: 'string',
        format: 'uuid',
        example: '770e8400-e29b-41d4-a716-446655440017'
      },
      isUsTaxpayer: {
        type: 'boolean',
        example: false
      },
      isUsPerson: {
        type: 'boolean',
        nullable: true,
        example: null
      },
      formType: {
        type: 'string',
        enum: ['w8', 'w9'],
        nullable: true,
        example: null
      },
      documentUrl: {
        type: 'string',
        nullable: true,
        example: null
      },
      usTin: {
        type: 'string',
        nullable: true,
        example: null
      },
      hasSameTaxResidencyAsBank: {
        type: 'boolean',
        nullable: true,
        example: true
      },
      taxCountries: {
        type: 'array',
        nullable: true,
        example: null
      },
      declarationText: {
        type: 'string',
        nullable: true,
        example: 'Declaro bajo juramento que mi residencia fiscal es Chile'
      },
      declarationAcceptedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-20T10:00:00.000Z'
      },
      status: {
        type: 'string',
        enum: ['pending', 'approved', 'rejected', 'change_requested', 'deactivation_requested', 'inactive'],
        example: 'approved'
      },
      rejectionReason: {
        type: 'string',
        nullable: true,
        example: null
      },
      reviewedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: '2024-01-21T09:00:00.000Z'
      },
      changeReason: {
        type: 'string',
        nullable: true,
        example: null
      },
      changeRequestedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null
      },
      newTaxResidencyData: {
        type: 'object',
        nullable: true,
        example: null
      },
      newDocumentUrl: {
        type: 'string',
        nullable: true,
        example: null
      },
      deactivationReason: {
        type: 'string',
        nullable: true,
        example: null
      },
      deactivationRequestedAt: {
        type: 'string',
        format: 'date-time',
        nullable: true,
        example: null
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-20T10:00:00.000Z'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-21T09:00:00.000Z'
      },
      reviewer: {
        $ref: '#/components/schemas/Reviewer'
      }
    }
  },

  // ============================================================
  // CREDIT REPORT
  // ============================================================

  CreditReport: {
    type: 'object',
    properties: {
      creditReportId: {
        type: 'string',
        format: 'uuid',
        example: '990e8400-e29b-41d4-a716-446655440004'
      },
      score: {
        type: 'integer',
        nullable: true,
        example: 750
      },
      scoreRange: {
        type: 'string',
        nullable: true,
        example: '300-850'
      },
      riskCategory: {
        type: 'string',
        enum: ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'UNKNOWN'],
        nullable: true,
        example: 'LOW'
      },
      recommendation: {
        type: 'string',
        nullable: true,
        example: 'Cliente con buen historial crediticio'
      },
      status: {
        type: 'string',
        enum: ['pending', 'completed', 'failed'],
        example: 'completed'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-01T08:00:00.000Z'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-02-01T08:05:00.000Z'
      }
    }
  },

  CreditReportDetailed: {
    allOf: [
      { $ref: '#/components/schemas/CreditReport' },
      {
        type: 'object',
        properties: {
          zapierRelationId: {
            type: 'string',
            example: 'zapsign_abc123'
          },
          pdfUrl: {
            type: 'string',
            nullable: true,
            example: 'https://zapsign.example.com/credit_report_latest.pdf'
          },
          rawData: {
            type: 'object',
            nullable: true,
            example: {}
          }
        }
      }
    ]
  }
};

module.exports = sharedSchemas;