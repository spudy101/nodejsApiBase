/**
 * Schemas de Swagger para KYC Profile
 */

const kycProfileSchemas = {
  // ==================== REQUEST SCHEMAS ====================

  UpdateProfileRequest: {
    type: 'object',
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        pattern: '^[a-zA-Z0-9_]+$',
        example: 'usuario123',
        description: 'Nombre de usuario (solo letras, números y guiones bajos)'
      },
      avatar_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del avatar seleccionado'
      },
      gender_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del genero seleccionado'
      },
      location: {
        type: 'object',
        required: ['country_id', 'department_id', 'city_id', 'address'],
        properties: {
          country_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
            description: 'ID del país'
          },
          department_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
            description: 'ID del departamento/estado'
          },
          city_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
            description: 'ID de la ciudad'
          },
          address: {
            type: 'string',
            maxLength: 255,
            example: 'Av. Principal 123',
            description: 'Dirección completa'
          },
          postal_code: {
            type: 'string',
            maxLength: 20,
            example: '12345',
            description: 'Código postal'
          },
          type: {
            type: 'string',
            maxLength: 40,
            example: 'Casa',
            description: 'Tipo de vivienda (Casa, Depto, etc.)'
          }
        }
      }
    },
    description: 'Datos para actualizar el perfil (enviar al menos un campo)'
  },

  UpdateEmailRequest: {
    type: 'object',
    required: ['email', 'currentPassword'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        maxLength: 100,
        example: 'nuevo@example.com',
        description: 'Nuevo email (debe estar verificado previamente)'
      },
      currentPassword: {
        type: 'string',
        format: 'password',
        example: 'Password123!',
        description: 'Contraseña actual del usuario'
      }
    }
  },

  UpdatePhoneRequest: {
    type: 'object',
    required: ['phone', 'phone_prefix_id', 'phone_type'],
    properties: {
      phone: {
        type: 'string',
        pattern: '^[0-9]+$',
        minLength: 6,
        maxLength: 15,
        example: '987654321',
        description: 'Número de teléfono (solo dígitos)'
      },
      phone_prefix_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del prefijo telefónico'
      },
      phone_type: {
        type: 'string',
        enum: ['primary', 'secondary'],
        example: 'primary',
        description: 'Tipo de teléfono'
      }
    }
  },

  UpdatePasswordRequest: {
    type: 'object',
    required: ['currentPassword', 'newPassword'],
    properties: {
      currentPassword: {
        type: 'string',
        format: 'password',
        example: 'OldPassword123!',
        description: 'Contraseña actual'
      },
      newPassword: {
        type: 'string',
        format: 'password',
        minLength: 8,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[\\^$*.\\[\\]{}()?\\-"!@#%&/\\\\,><\':;|_~`+=])',
        example: 'NewPassword123!',
        description: 'Nueva contraseña (mínimo 8 caracteres, debe contener mayúscula, minúscula, número y carácter especial)'
      }
    }
  },

  UpdateNationalIdRequest: {
    type: 'object',
    required: ['newNationalId', 'currentPassword'],
    properties: {
      newNationalId: {
        type: 'string',
        maxLength: 20,
        example: '12345678-9',
        description: 'Nueva identificación nacional'
      },
      currentPassword: {
        type: 'string',
        format: 'password',
        example: 'Password123!',
        description: 'Contraseña actual del usuario'
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
        example: 'Password123!',
        description: 'Contraseña actual del usuario para confirmar eliminación'
      }
    }
  },

  // ==================== RESPONSE SCHEMAS ====================

  BasicProfileResponse: {
    type: 'object',
    properties: {
      userId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      username: {
        type: 'string',
        example: 'usuario123'
      },
      isActive: {
        type: 'boolean',
        example: true
      },
      mfaEnabled: {
        type: 'boolean',
        example: false
      },
      person: {
        type: 'object',
        properties: {
          personId: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          firstName: {
            type: 'string',
            example: 'Juan'
          },
          lastName: {
            type: 'string',
            example: 'Pérez'
          },
          nationalId: {
            type: 'string',
            example: '12345678-9'
          },
          birthDate: {
            type: 'string',
            format: 'date',
            example: '1990-01-15'
          },
          genderId: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          countryId: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      },
      role: {
        type: 'object',
        properties: {
          roleId: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          name: {
            type: 'string',
            example: 'client'
          },
          description: {
            type: 'string',
            example: 'Cliente del sistema'
          }
        }
      },
      avatar: {
        type: 'object',
        nullable: true,
        properties: {
          avatarId: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          url: {
            type: 'string',
            format: 'uri',
            example: 'https://example.com/avatars/avatar1.png'
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
          location: {
            type: 'object',
            nullable: true,
            properties: {
              address: {
                type: 'string',
                example: 'Av. Principal 123'
              },
              postalCode: {
                type: 'string',
                example: '12345'
              },
              type: {
                type: 'string',
                example: 'Casa'
              },
              country: {
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
                  url: {
                    type: 'string',
                    format: 'uri',
                    example: 'https://example.com/flags/cl.png'
                  }
                }
              },
              department: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'Región Metropolitana'
                  }
                }
              },
              city: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    example: 'Santiago'
                  }
                }
              }
            }
          },
          contact: {
            type: 'object',
            nullable: true,
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
                example: '2024-01-17T10:30:00.000Z'
              },
              phonePrimary: {
                type: 'string',
                nullable: true,
                example: '987654321'
              },
              phonePrimaryVerifiedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                example: '2024-01-17T10:30:00.000Z'
              },
              phoneSecondary: {
                type: 'string',
                nullable: true,
                example: '912345678'
              },
              phoneSecondaryVerifiedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
                example: '2024-01-17T10:30:00.000Z'
              },
              phonePrimaryPrefix: {
                type: 'string',
                nullable: true,
                example: '+56'
              },
              phoneSecondaryPrefix: {
                type: 'string',
                nullable: true,
                example: '+56'
              }
            }
          },
          gender: {
            type: 'object',
            nullable: true,
            properties: {
              name: {
                type: 'string',
                example: 'Masculino'
              }
            }
          },
          socialNetworks: {
            type: 'array',
            nullable: true,
            items: {
              type: 'object',
              properties: {
                username_handle: {
                  type: 'string',
                  example: '@usuario123'
                },
                profile_url: {
                  type: 'string',
                  format: 'uri',
                  example: 'https://twitter.com/usuario123'
                },
                is_verified: {
                  type: 'boolean',
                  example: false
                },
                provider: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      example: 'Twitter'
                    },
                    icon_url: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://example.com/icons/twitter.png'
                    },
                    base_url: {
                      type: 'string',
                      format: 'uri',
                      example: 'https://twitter.com'
                    }
                  }
                }
              }
            }
          },
          country: {
            type: 'object',
            nullable: true,
            properties: {
              name: {
                type: 'string',
                example: 'Chile'
              },
              code: {
                type: 'string',
                example: 'CL'
              },
              url: {
                type: 'string',
                format: 'uri',
                example: 'https://example.com/flags/cl.png'
              }
            }
          }
        }
      }
    ]
  },

  LocationResponse: {
    type: 'object',
    properties: {
      location: {
        type: 'object',
        nullable: true,
        properties: {
          address: {
            type: 'string',
            example: 'Av. Principal 123'
          },
          postalCode: {
            type: 'string',
            example: '12345'
          },
          type: {
            type: 'string',
            example: 'Casa'
          },
          country: {
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
              url: {
                type: 'string',
                format: 'uri',
                example: 'https://example.com/flags/cl.png'
              }
            }
          },
          department: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'Región Metropolitana'
              }
            }
          },
          city: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                example: 'Santiago'
              }
            }
          }
        }
      }
    }
  },

  ContactInfoResponse: {
    type: 'object',
    properties: {
      person_contact_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      person_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      email: {
        type: 'object',
        properties: {
          address: {
            type: 'string',
            format: 'email',
            example: 'usuario@example.com'
          },
          verified: {
            type: 'boolean',
            example: true
          },
          verified_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2024-01-17T10:30:00.000Z'
          }
        }
      },
      phone_primary: {
        type: 'object',
        nullable: true,
        properties: {
          number: {
            type: 'string',
            example: '987654321'
          },
          verified: {
            type: 'boolean',
            example: true
          },
          verified_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2024-01-17T10:30:00.000Z'
          },
          prefix: {
            type: 'object',
            nullable: true,
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000'
              },
              prefix: {
                type: 'string',
                example: '+56'
              }
            }
          }
        }
      },
      phone_secondary: {
        type: 'object',
        nullable: true,
        properties: {
          number: {
            type: 'string',
            example: '912345678'
          },
          verified: {
            type: 'boolean',
            example: false
          },
          verified_at: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: null
          },
          prefix: {
            type: 'object',
            nullable: true,
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                example: '123e4567-e89b-12d3-a456-426614174000'
              },
              prefix: {
                type: 'string',
                example: '+56'
              }
            }
          }
        }
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  UpdateEmailResponse: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'nuevo@example.com'
      },
      email_verified_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  UpdatePhoneResponse: {
    type: 'object',
    properties: {
      phone: {
        type: 'string',
        example: '987654321'
      },
      phone_prefix_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      phone_type: {
        type: 'string',
        enum: ['primary', 'secondary'],
        example: 'primary'
      },
      verified_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  ChangeNationalIdResponse: {
    type: 'object',
    properties: {
      user_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      },
      username: {
        type: 'string',
        example: 'usuario123'
      },
      old_national_id: {
        type: 'string',
        example: '12345678-9'
      },
      new_national_id: {
        type: 'string',
        example: '98765432-1'
      }
    }
  }
};

module.exports = kycProfileSchemas;