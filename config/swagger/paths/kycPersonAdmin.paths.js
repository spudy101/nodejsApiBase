/**
 * Paths de KYC Person (Admin)
 * Ruta base: /admin/api/kyc/person
 */

const commonResponses = require('../responses/common.responses');

const kycPersonPaths = {
  '/admin/api/kyc/person': {
    get: {
      tags: ['KYC Person - Admin'],
      summary: 'Listar usuarios con paginación y filtros',
      description: 'Obtiene una lista paginada de usuarios con filtros opcionales de búsqueda, estado activo y rol',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Número de página'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Cantidad de elementos por página'
        },
        {
          in: 'query',
          name: 'sortBy',
          schema: {
            type: 'string',
            enum: ['username', 'createdAt', 'updatedAt', 'is_active'],
            default: 'createdAt'
          },
          description: 'Campo por el cual ordenar'
        },
        {
          in: 'query',
          name: 'order',
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC'],
            default: 'DESC'
          },
          description: 'Dirección del ordenamiento'
        },
        {
          in: 'query',
          name: 'search',
          schema: {
            type: 'string'
          },
          description: 'Término de búsqueda (busca en username, nombre, email)'
        },
        {
          in: 'query',
          name: 'isActive',
          schema: {
            type: 'boolean'
          },
          description: 'Filtrar por estado activo/inactivo'
        },
        {
          in: 'query',
          name: 'roleId',
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Filtrar por ID de rol'
        }
      ],
      responses: {
        200: {
          description: 'Lista de usuarios obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UserListSuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Usuarios obtenidos exitosamente',
                data: [
                  {
                    user_id: '123e4567-e89b-12d3-a456-426614174005',
                    username: '12345678-9',
                    is_active: true,
                    totp_enabled: false,
                    createdAt: '2024-01-17T10:30:00.000Z',
                    person: {
                      first_name: 'Juan',
                      last_name: 'Pérez',
                      national_id: '12345678-9'
                    },
                    email: 'juan.perez@example.com',
                    email_verified: true,
                    role: {
                      role_id: '123e4567-e89b-12d3-a456-426614174000',
                      name: 'admin'
                    }
                  }
                ],
                metadata: {
                  pagination: {
                    currentPage: 1,
                    pageSize: 10,
                    totalItems: 100,
                    totalPages: 10,
                    hasNextPage: true,
                    hasPreviousPage: false
                  },
                  sort: {
                    sortBy: 'createdAt',
                    order: 'DESC'
                  },
                  filters: {
                    isActive: true
                  }
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: commonResponses.Unauthorized,
        403: commonResponses.Forbidden,
        422: commonResponses.ValidationError,
        500: commonResponses.InternalServerError
      }
    },

    post: {
      tags: ['KYC Person - Admin'],
      summary: 'Crear nuevo usuario',
      description: 'Crea un nuevo usuario en el sistema. Genera automáticamente una contraseña temporal que se envía por email.',
      security: [{ BearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateUserRequest'
            },
            example: {
              nationalId: '12345678-9',
              email: 'nuevo.usuario@example.com',
              firstName: 'Juan',
              lastName: 'Pérez',
              roleId: '123e4567-e89b-12d3-a456-426614174000',
              birthDate: '1990-01-15',
              genderId: '123e4567-e89b-12d3-a456-426614174001',
              countryId: '123e4567-e89b-12d3-a456-426614174002'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Usuario creado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateUserSuccessResponse'
              },
              example: {
                success: true,
                statusCode: 201,
                message: 'Usuario creado exitosamente',
                data: {
                  user: {
                    user_id: '123e4567-e89b-12d3-a456-426614174005',
                    username: '12345678-9',
                    is_active: true,
                    totp_enabled: false,
                    createdAt: '2024-01-17T10:30:00.000Z',
                    updatedAt: '2024-01-17T10:30:00.000Z',
                    person: {
                      person_id: '123e4567-e89b-12d3-a456-426614174004',
                      first_name: 'Juan',
                      last_name: 'Pérez',
                      national_id: '12345678-9',
                      birth_date: '1990-01-15'
                    },
                    role: {
                      role_id: '123e4567-e89b-12d3-a456-426614174000',
                      name: 'admin'
                    }
                  }
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        401: commonResponses.Unauthorized,
        403: commonResponses.Forbidden,
        409: commonResponses.Conflict,
        422: commonResponses.ValidationError,
        500: commonResponses.InternalServerError
      }
    }
  },

  '/admin/api/kyc/person/{userId}/activate': {
    post: {
      tags: ['KYC Person - Admin'],
      summary: 'Activar usuario',
      description: 'Activa un usuario previamente desactivado',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID del usuario a activar'
        }
      ],
      responses: {
        200: {
          description: 'Usuario activado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ToggleUserStatusSuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Usuario activado exitosamente',
                data: {
                  user_id: '123e4567-e89b-12d3-a456-426614174005',
                  username: '12345678-9',
                  is_active: true
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        401: commonResponses.Unauthorized,
        403: commonResponses.Forbidden,
        404: commonResponses.NotFound,
        422: commonResponses.ValidationError,
        500: commonResponses.InternalServerError
      }
    }
  },

  '/admin/api/kyc/person/{userId}/deactivate': {
    post: {
      tags: ['KYC Person - Admin'],
      summary: 'Desactivar usuario',
      description: 'Desactiva un usuario activo, impidiendo su acceso al sistema',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID del usuario a desactivar'
        }
      ],
      responses: {
        200: {
          description: 'Usuario desactivado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ToggleUserStatusSuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Usuario desactivado exitosamente',
                data: {
                  user_id: '123e4567-e89b-12d3-a456-426614174005',
                  username: '12345678-9',
                  is_active: false
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        401: commonResponses.Unauthorized,
        403: commonResponses.Forbidden,
        404: commonResponses.NotFound,
        422: commonResponses.ValidationError,
        500: commonResponses.InternalServerError
      }
    }
  },

  '/admin/api/kyc/person/{userId}/reset-password': {
    post: {
      tags: ['KYC Person - Admin'],
      summary: 'Resetear contraseña',
      description: 'Genera una nueva contraseña temporal para el usuario y la envía por email',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID del usuario'
        }
      ],
      responses: {
        200: {
          description: 'Contraseña reseteada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ResetPasswordSuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Contraseña reseteada exitosamente',
                data: {
                  user_id: '123e4567-e89b-12d3-a456-426614174005',
                  username: '12345678-9',
                  email: 'usuario@example.com'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        401: commonResponses.Unauthorized,
        403: commonResponses.Forbidden,
        404: commonResponses.NotFound,
        422: commonResponses.ValidationError,
        500: commonResponses.InternalServerError
      }
    }
  },

  '/admin/api/kyc/person/{userId}/disable-mfa': {
    post: {
      tags: ['KYC Person - Admin'],
      summary: 'Desactivar MFA',
      description: 'Desactiva la autenticación multifactor (TOTP) de un usuario',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID del usuario'
        }
      ],
      responses: {
        200: {
          description: 'MFA desactivado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DisableMFASuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'MFA desactivado exitosamente',
                data: {
                  user_id: '123e4567-e89b-12d3-a456-426614174005',
                  username: '12345678-9',
                  totp_enabled: false
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        401: commonResponses.Unauthorized,
        403: commonResponses.Forbidden,
        404: commonResponses.NotFound,
        422: commonResponses.ValidationError,
        500: commonResponses.InternalServerError
      }
    }
  },

  '/admin/api/kyc/person/{userId}/email': {
    patch: {
      tags: ['KYC Person - Admin'],
      summary: 'Cambiar email de usuario',
      description: 'Actualiza el email de un usuario. Se marca automáticamente como verificado.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID del usuario'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ChangeEmailRequest'
            },
            example: {
              newEmail: 'nuevo.email@example.com'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Email actualizado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChangeEmailSuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Email actualizado exitosamente',
                data: {
                  user_id: '123e4567-e89b-12d3-a456-426614174005',
                  username: '12345678-9',
                  old_email: 'viejo@example.com',
                  new_email: 'nuevo.email@example.com',
                  email_verified: true
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        401: commonResponses.Unauthorized,
        403: commonResponses.Forbidden,
        404: commonResponses.NotFound,
        409: commonResponses.Conflict,
        422: commonResponses.ValidationError,
        500: commonResponses.InternalServerError
      }
    }
  },

  '/admin/api/kyc/person/{userId}/national-id': {
    patch: {
      tags: ['KYC Person - Admin'],
      summary: 'Cambiar National ID',
      description: 'Actualiza el número de identificación nacional de un usuario',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID del usuario'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ChangeNationalIdRequest'
            },
            example: {
              newNationalId: '98765432-1'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'National ID actualizado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChangeNationalIdSuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'National ID actualizado exitosamente',
                data: {
                  user_id: '123e4567-e89b-12d3-a456-426614174005',
                  username: '98765432-1',
                  old_national_id: '12345678-9',
                  new_national_id: '98765432-1'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        401: commonResponses.Unauthorized,
        403: commonResponses.Forbidden,
        404: commonResponses.NotFound,
        409: commonResponses.Conflict,
        422: commonResponses.ValidationError,
        500: commonResponses.InternalServerError
      }
    }
  },

  '/admin/api/kyc/person/{userId}/role': {
    patch: {
      tags: ['KYC Person - Admin'],
      summary: 'Cambiar rol de usuario',
      description: 'Actualiza el rol asignado a un usuario',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID del usuario'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ChangeRoleRequest'
            },
            example: {
              newRoleId: '123e4567-e89b-12d3-a456-426614174003'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Rol actualizado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ChangeRoleSuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Rol actualizado exitosamente',
                data: {
                  user_id: '123e4567-e89b-12d3-a456-426614174005',
                  username: '12345678-9',
                  old_role: {
                    role_id: '123e4567-e89b-12d3-a456-426614174000',
                    name: 'user'
                  },
                  new_role: {
                    role_id: '123e4567-e89b-12d3-a456-426614174003',
                    name: 'admin'
                  }
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        401: commonResponses.Unauthorized,
        403: commonResponses.Forbidden,
        404: commonResponses.NotFound,
        422: commonResponses.ValidationError,
        500: commonResponses.InternalServerError
      }
    }
  },

  '/admin/api/kyc/person/{userId}/delete-account': {
    delete: {
      tags: ['KYC Person - Admin'],
      summary: 'Eliminar cuenta de usuario',
      description: 'Elimina permanentemente la cuenta de un usuario. Requiere la contraseña del administrador para confirmar la acción.',
      security: [{ BearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'userId',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID del usuario a eliminar'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/DeleteAccountRequest'
            },
            example: {
              currentPassword: 'Admin123!'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Cuenta eliminada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DeleteAccountSuccessResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Cuenta eliminada exitosamente',
                data: null,
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: commonResponses.BadRequest,
        401: commonResponses.Unauthorized,
        403: commonResponses.Forbidden,
        404: commonResponses.NotFound,
        422: commonResponses.ValidationError,
        500: commonResponses.InternalServerError
      }
    }
  }
};

module.exports = kycPersonPaths;