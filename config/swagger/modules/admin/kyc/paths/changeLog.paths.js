/**
 * Paths de Swagger para el módulo ChangeLog
 * Define todos los endpoints y su documentación
 */

const changeLogPaths = {
  // ==================== USER CHANGE LOGS ====================

  '/admin/api/change-logs/users': {
    get: {
      tags: ['Change Logs - Admin'],
      summary: 'Lista logs de cambios de usuarios',
      description: 'Obtiene una lista paginada de logs de cambios realizados a usuarios con filtros opcionales',
      operationId: 'listUserChangeLogs',
      security: [
        {
          bearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'Número de página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1,
            example: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Cantidad de elementos por página',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10,
            example: 10
          }
        },
        {
          name: 'sortBy',
          in: 'query',
          description: 'Campo por el cual ordenar',
          required: false,
          schema: {
            type: 'string',
            default: 'created_at',
            example: 'created_at'
          }
        },
        {
          name: 'order',
          in: 'query',
          description: 'Dirección del ordenamiento',
          required: false,
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC',
            example: 'DESC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en username, email, nombre)',
          required: false,
          schema: {
            type: 'string',
            example: 'john'
          }
        },
        {
          name: 'changeType',
          in: 'query',
          description: 'Filtrar por tipo de cambio',
          required: false,
          schema: {
            type: 'string',
            enum: ['email', 'password', 'mfa_status', 'account_status', 'role', 'national_id'],
            example: 'email'
          }
        },
        {
          name: 'changedByRole',
          in: 'query',
          description: 'Filtrar por rol del usuario que realizó el cambio',
          required: false,
          schema: {
            type: 'string',
            enum: ['admin', 'user', 'system'],
            example: 'admin'
          }
        },
        {
          name: 'userId',
          in: 'query',
          description: 'Filtrar por ID de usuario específico',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        }
      ],
      responses: {
        200: {
          description: 'Lista de logs de cambios de usuarios obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListUserChangeLogsResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Logs de cambios de usuarios obtenidos exitosamente',
                data: [
                  {
                    log_id: '123e4567-e89b-12d3-a456-426614174000',
                    user_id: '123e4567-e89b-12d3-a456-426614174001',
                    changed_by_user_id: '123e4567-e89b-12d3-a456-426614174002',
                    changed_by_role: 'admin',
                    change_type: 'email',
                    previous_value: 'old@example.com',
                    new_value: 'new@example.com',
                    change_reason: 'Usuario solicitó cambio de email',
                    ip_address: '192.168.1.1',
                    created_at: '2024-01-17T10:30:00.000Z',
                    user: {
                      user_id: '123e4567-e89b-12d3-a456-426614174001',
                      username: 'john_doe',
                      email: 'new@example.com',
                      first_name: 'John',
                      last_name: 'Doe'
                    },
                    changed_by: {
                      user_id: '123e4567-e89b-12d3-a456-426614174002',
                      username: 'admin_user',
                      email: 'admin@example.com',
                      first_name: 'Admin',
                      last_name: 'User'
                    }
                  }
                ],
                metadata: {
                  pagination: {
                    currentPage: 1,
                    pageSize: 10,
                    totalItems: 50,
                    totalPages: 5,
                    hasNextPage: true,
                    hasPreviousPage: false
                  },
                  filters: {
                    changeType: 'email',
                    changedByRole: 'admin'
                  },
                  sort: {
                    field: 'created_at',
                    order: 'DESC'
                  }
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        403: {
          $ref: '#/components/responses/Forbidden'
        },
        422: {
          $ref: '#/components/responses/ValidationError'
        },
        429: {
          $ref: '#/components/responses/RateLimitExceeded'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
};

module.exports = changeLogPaths;