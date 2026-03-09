/**
 * Paths para Core Maintainers
 */

const maintainersPaths = {
  // ==================== GENDERS ====================

  '/<admin>o<client>/api/common/maintainers/genders': {
    get: {
      tags: ['Core Maintainers - Shared'],
      summary: 'Listar géneros con paginación',
      description: 'Obtiene una lista paginada de géneros con opciones de búsqueda, filtrado y ordenamiento',
      operationId: 'listGenders',
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
            enum: ['name', 'createdAt', 'updatedAt'],
            default: 'name',
            example: 'name'
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
            default: 'ASC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en el campo name)',
          required: false,
          schema: {
            type: 'string',
            example: 'mujer'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        }
      ],
      responses: {
        200: {
          description: 'Géneros obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListGendersResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
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

  // ==================== PHONE PREFIXES ====================

  '/<admin>o<client>/api/common/maintainers/phone-prefixes': {
    get: {
      tags: ['Core Maintainers - Shared'],
      summary: 'Listar prefijos telefónicos con paginación',
      description: 'Obtiene una lista paginada de prefijos telefónicos con opciones de búsqueda, filtrado y ordenamiento',
      operationId: 'listPhonePrefixes',
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
            enum: ['prefix', 'createdAt', 'updatedAt'],
            default: 'prefix',
            example: 'prefix'
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
            default: 'ASC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en el campo prefix)',
          required: false,
          schema: {
            type: 'string',
            example: '56'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'countryId',
          in: 'query',
          description: 'Filtrar por ID de país',
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
          description: 'Prefijos telefónicos obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListPhonePrefixesResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
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

  // ==================== AVATARS ====================

  '/<admin>o<client>/api/common/maintainers/avatars': {
    get: {
      tags: ['Core Maintainers - Shared'],
      summary: 'Listar avatares con paginación',
      description: 'Obtiene una lista paginada de avatares con opciones de búsqueda, filtrado y ordenamiento',
      operationId: 'listAvatars',
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
            enum: ['name', 'createdAt', 'updatedAt'],
            default: 'name',
            example: 'name'
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
            default: 'ASC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en el campo name)',
          required: false,
          schema: {
            type: 'string',
            example: 'robot'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'themeId',
          in: 'query',
          description: 'Filtrar por ID de tema',
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
          description: 'Avatares obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListAvatarsResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
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

  // ==================== AVATAR THEMES ====================

  '/<admin>o<client>/api/common/maintainers/avatar-themes': {
    get: {
      tags: ['Core Maintainers - Shared'],
      summary: 'Listar temas de avatares con paginación',
      description: 'Obtiene una lista paginada de temas de avatares con opciones de búsqueda, filtrado y ordenamiento',
      operationId: 'listAvatarThemes',
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
            enum: ['name', 'createdAt', 'updatedAt'],
            default: 'name',
            example: 'name'
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
            default: 'ASC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en los campos name y description)',
          required: false,
          schema: {
            type: 'string',
            example: 'animales'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        }
      ],
      responses: {
        200: {
          description: 'Temas de avatares obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListAvatarThemesResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
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

  // ==================== COUNTRIES ====================

  '/<admin>o<client>/api/common/maintainers/countries': {
    get: {
      tags: ['Core Maintainers - Shared'],
      summary: 'Listar países con paginación',
      description: 'Obtiene una lista paginada de países con opciones de búsqueda, filtrado y ordenamiento',
      operationId: 'listCountries',
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
            enum: ['name', 'code', 'createdAt', 'updatedAt'],
            default: 'name',
            example: 'name'
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
            default: 'ASC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en los campos name y code)',
          required: false,
          schema: {
            type: 'string',
            example: 'chile'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        }
      ],
      responses: {
        200: {
          description: 'Países obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListCountriesResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
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

  // ==================== DEPARTMENTS ====================

  '/<admin>o<client>/api/common/maintainers/departments': {
    get: {
      tags: ['Core Maintainers - Shared'],
      summary: 'Listar departamentos/estados con paginación',
      description: 'Obtiene una lista paginada de departamentos/estados con opciones de búsqueda, filtrado y ordenamiento',
      operationId: 'listDepartments',
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
            enum: ['name', 'createdAt', 'updatedAt'],
            default: 'name',
            example: 'name'
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
            default: 'ASC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en el campo name)',
          required: false,
          schema: {
            type: 'string',
            example: 'santiago'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'countryId',
          in: 'query',
          description: 'Filtrar por ID de país',
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
          description: 'Departamentos obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListDepartmentsResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
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

  // ==================== CITIES ====================

  '/<admin>o<client>/api/common/maintainers/cities': {
    get: {
      tags: ['Core Maintainers - Shared'],
      summary: 'Listar ciudades con paginación',
      description: 'Obtiene una lista paginada de ciudades con opciones de búsqueda, filtrado y ordenamiento',
      operationId: 'listCities',
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
            enum: ['name', 'createdAt', 'updatedAt'],
            default: 'name',
            example: 'name'
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
            default: 'ASC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en el campo name)',
          required: false,
          schema: {
            type: 'string',
            example: 'puente'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'departmentId',
          in: 'query',
          description: 'Filtrar por ID de departamento',
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
          description: 'Ciudades obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListCitiesResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
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

  // ==================== NOTIFICATION TYPES ====================

  '/<admin>o<client>/api/common/maintainers/notification-types': {
    get: {
      tags: ['Core Maintainers - Shared'],
      summary: 'Listar tipos de notificación con paginación',
      description: 'Obtiene una lista paginada de tipos de notificación con opciones de búsqueda, filtrado y ordenamiento',
      operationId: 'listNotificationTypes',
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
            enum: ['name', 'code', 'priority', 'createdAt', 'updatedAt'],
            default: 'name',
            example: 'name'
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
            default: 'ASC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en los campos name, code y description)',
          required: false,
          schema: {
            type: 'string',
            example: 'push'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'supportsPush',
          in: 'query',
          description: 'Filtrar por soporte de notificaciones push',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'supportsEmail',
          in: 'query',
          description: 'Filtrar por soporte de notificaciones por email',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'priority',
          in: 'query',
          description: 'Filtrar por nivel de prioridad (1-5)',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            example: 1
          }
        }
      ],
      responses: {
        200: {
          description: 'Tipos de notificaciones obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListNotificationTypesResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
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

  // ==================== ROLES ====================

  '/<admin>o<client>/api/common/maintainers/roles': {
    get: {
      tags: ['Core Maintainers - Shared'],
      summary: 'Listar roles con paginación',
      description: 'Obtiene una lista paginada de roles con opciones de búsqueda, filtrado y ordenamiento',
      operationId: 'listRoles',
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
            enum: ['name', 'createdAt', 'updatedAt'],
            default: 'name',
            example: 'name'
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
            default: 'ASC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en los campos name y description)',
          required: false,
          schema: {
            type: 'string',
            example: 'admin'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        }
      ],
      responses: {
        200: {
          description: 'Roles obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListRolesResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
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

  // ==================== INSTITUTIONS ====================

  '/<admin>o<client>/api/common/maintainers/institutions': {
    get: {
      tags: ['Core Maintainers - Shared'],
      summary: 'Listar instituciones con paginación',
      description: 'Obtiene una lista paginada de instituciones con opciones de búsqueda, filtrado y ordenamiento',
      operationId: 'listInstitutions',
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
            example: 'name'
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
            default: 'ASC',
            example: 'ASC'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Término de búsqueda (busca en el campo name)',
          required: false,
          schema: {
            type: 'string',
            example: 'Universidad'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'hasAgreement',
          in: 'query',
          description: 'Filtrar por instituciones con o sin convenio',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'countryId',
          in: 'query',
          description: 'Filtrar por ID del país',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        },
        {
          name: 'themeId',
          in: 'query',
          description: 'Filtrar por ID del tema',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        },
        {
          name: 'departmentId',
          in: 'query',
          description: 'Filtrar por ID del departamento',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          }
        },
        {
          name: 'supportsPush',
          in: 'query',
          description: 'Filtrar por soporte de notificaciones push',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'supportsEmail',
          in: 'query',
          description: 'Filtrar por soporte de email',
          required: false,
          schema: {
            type: 'boolean',
            example: true
          }
        },
        {
          name: 'priority',
          in: 'query',
          description: 'Filtrar por nivel de prioridad',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            example: 3
          }
        }
      ],
      responses: {
        200: {
          description: 'Instituciones obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ListInstitutionsResponse'
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/BadRequest'
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

module.exports = maintainersPaths;