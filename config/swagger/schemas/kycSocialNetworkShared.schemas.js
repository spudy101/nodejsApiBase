/**
 * Schemas para KYC Social Networks
 */

const kycSocialNetworkSchemas = {
  // ==================== REQUEST SCHEMAS ====================

  AddSocialNetworkRequest: {
    type: 'object',
    required: ['social_network_provider_id', 'username_handle'],
    properties: {
      social_network_provider_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del proveedor de red social'
      },
      username_handle: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        example: '@usuario123',
        description: 'Nombre de usuario o handle en la red social'
      },
      profile_url: {
        type: 'string',
        format: 'uri',
        maxLength: 255,
        example: 'https://twitter.com/usuario123',
        description: 'URL del perfil en la red social (opcional)',
        nullable: true
      }
    }
  },

  UpdateSocialNetworkRequest: {
    type: 'object',
    required: ['person_social_network_id'],
    properties: {
      person_social_network_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la red social a actualizar'
      },
      username_handle: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
        example: '@usuario_actualizado',
        description: 'Nuevo nombre de usuario o handle (opcional)',
        nullable: true
      },
      profile_url: {
        type: 'string',
        format: 'uri',
        maxLength: 255,
        example: 'https://twitter.com/usuario_actualizado',
        description: 'Nueva URL del perfil (opcional, null para eliminar)',
        nullable: true
      }
    }
  },

  DeleteSocialNetworkRequest: {
    type: 'object',
    required: ['person_social_network_id'],
    properties: {
      person_social_network_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la red social a eliminar'
      }
    }
  },

  // ==================== RESPONSE SCHEMAS ====================

  SocialNetworkProvider: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del proveedor'
      },
      name: {
        type: 'string',
        example: 'Twitter',
        description: 'Nombre del proveedor',
        nullable: true
      },
      icon_url: {
        type: 'string',
        format: 'uri',
        example: 'https://example.com/icons/twitter.png',
        description: 'URL del icono del proveedor',
        nullable: true
      },
      base_url: {
        type: 'string',
        format: 'uri',
        example: 'https://twitter.com',
        description: 'URL base del proveedor',
        nullable: true
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el proveedor está activo',
        nullable: true
      }
    }
  },

  SocialNetwork: {
    type: 'object',
    properties: {
      person_social_network_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la red social'
      },
      person_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la persona'
      },
      provider: {
        $ref: '#/components/schemas/SocialNetworkProvider'
      },
      username_handle: {
        type: 'string',
        example: '@usuario123',
        description: 'Nombre de usuario o handle'
      },
      profile_url: {
        type: 'string',
        format: 'uri',
        example: 'https://twitter.com/usuario123',
        description: 'URL del perfil',
        nullable: true
      },
      is_verified: {
        type: 'boolean',
        example: false,
        description: 'Indica si la red social está verificada'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updated_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  SocialNetworkListResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              total: {
                type: 'integer',
                example: 3,
                description: 'Total de redes sociales'
              },
              social_networks: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/SocialNetwork'
                }
              }
            }
          }
        }
      }
    ]
  },

  AddSocialNetworkResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/SocialNetwork'
          }
        }
      }
    ]
  },

  UpdateSocialNetworkResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            $ref: '#/components/schemas/SocialNetwork'
          }
        }
      }
    ]
  },

  DeleteSocialNetworkResponse: {
    allOf: [
      {
        $ref: '#/components/schemas/SuccessResponse'
      },
      {
        type: 'object',
        properties: {
          data: {
            type: 'null',
            example: null
          }
        }
      }
    ]
  }
};

module.exports = kycSocialNetworkSchemas;