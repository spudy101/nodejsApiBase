/**
 * Schemas de Swagger para el módulo ChangeLog
 * Define todos los modelos de datos, DTOs y estructuras de respuesta
 */

const changeLogSchemas = {
  // ==================== COMMON DTOs ====================

  UserDto: {
    type: 'object',
    properties: {
      user_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único del usuario'
      },
      username: {
        type: 'string',
        example: 'john_doe',
        description: 'Nombre de usuario'
      },
      email: {
        type: 'string',
        format: 'email',
        example: 'john@example.com',
        description: 'Email del usuario',
        nullable: true
      },
      first_name: {
        type: 'string',
        example: 'John',
        description: 'Nombre del usuario',
        nullable: true
      },
      last_name: {
        type: 'string',
        example: 'Doe',
        description: 'Apellido del usuario',
        nullable: true
      },
      avatar: {
        type: 'object',
        nullable: true,
        properties: {
          avatar_id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000',
            description: 'ID del avatar'
          },
          name: {
            type: 'string',
            example: 'avatar.png',
            description: 'Nombre del archivo de avatar'
          }
        }
      }
    }
  },

  // ==================== USER CHANGE LOG ====================

  UserChangeLogDto: {
    type: 'object',
    required: [
      'log_id',
      'user_id',
      'changed_by_role',
      'change_type',
      'created_at'
    ],
    properties: {
      log_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID único del log'
      },
      user_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del usuario modificado'
      },
      changed_by_user_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del usuario que realizó el cambio',
        nullable: true
      },
      changed_by_role: {
        type: 'string',
        enum: ['admin', 'user', 'system'],
        example: 'admin',
        description: 'Rol del usuario que realizó el cambio'
      },
      change_type: {
        type: 'string',
        enum: ['email', 'password', 'mfa_status', 'account_status', 'role', 'national_id'],
        example: 'email',
        description: 'Tipo de cambio realizado'
      },
      previous_value: {
        type: 'string',
        example: 'old@example.com',
        description: 'Valor anterior del campo modificado',
        nullable: true
      },
      new_value: {
        type: 'string',
        example: 'new@example.com',
        description: 'Nuevo valor del campo modificado',
        nullable: true
      },
      change_reason: {
        type: 'string',
        example: 'Usuario solicitó cambio de email',
        description: 'Razón del cambio',
        nullable: true
      },
      ip_address: {
        type: 'string',
        example: '192.168.1.1',
        description: 'Dirección IP desde donde se realizó el cambio',
        nullable: true
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha y hora de creación del log'
      },
      user: {
        $ref: '#/components/schemas/UserDto',
        description: 'Información del usuario modificado',
        nullable: true
      },
      changed_by: {
        $ref: '#/components/schemas/UserDto',
        description: 'Información del usuario que realizó el cambio',
        nullable: true
      }
    }
  },

  ListUserChangeLogsResponse: {
    allOf: [
      {
        type: 'object',
        required: ['success', 'statusCode', 'message', 'data', 'metadata', 'timestamp'],
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          statusCode: {
            type: 'integer',
            example: 200
          },
          message: {
            type: 'string',
            example: 'Logs de cambios de usuarios obtenidos exitosamente'
          },
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/UserChangeLogDto'
            }
          },
          metadata: {
            type: 'object',
            properties: {
              pagination: {
                $ref: '#/components/schemas/PaginationMetadata'
              },
              filters: {
                type: 'object',
                nullable: true,
                properties: {
                  changeType: {
                    type: 'string',
                    example: 'email'
                  },
                  changedByRole: {
                    type: 'string',
                    example: 'admin'
                  },
                  userId: {
                    type: 'string',
                    format: 'uuid',
                    example: '123e4567-e89b-12d3-a456-426614174000'
                  },
                  search: {
                    type: 'string',
                    example: 'john'
                  }
                }
              },
              sort: {
                type: 'object',
                nullable: true,
                properties: {
                  field: {
                    type: 'string',
                    example: 'created_at'
                  },
                  order: {
                    type: 'string',
                    enum: ['ASC', 'DESC'],
                    example: 'DESC'
                  }
                }
              }
            }
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-17T10:30:00.000Z'
          }
        }
      }
    ]
  },
};

module.exports = changeLogSchemas;