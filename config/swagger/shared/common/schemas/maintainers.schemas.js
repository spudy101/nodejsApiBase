/**
 * Schemas para Core Maintainers
 */

const maintainersSchemas = {
  // ==================== GENDER ====================

  Gender: {
    type: 'object',
    required: ['gender_id', 'name', 'is_active', 'createdAt', 'updatedAt'],
    properties: {
      gender_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del género'
      },
      name: {
        type: 'string',
        example: 'Masculino',
        description: 'Nombre del género'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el género está activo'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  ListGendersResponse: {
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
        example: 'Géneros obtenidos exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Gender'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  // ==================== PHONE PREFIX ====================

  CountryNested: {
    type: 'object',
    required: ['country_id', 'name', 'code'],
    properties: {
      country_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del país'
      },
      name: {
        type: 'string',
        example: 'Chile',
        description: 'Nombre del país'
      },
      code: {
        type: 'string',
        example: 'CL',
        description: 'Código ISO del país'
      }
    }
  },

  PhonePrefix: {
    type: 'object',
    required: ['phone_prefix_id', 'prefix', 'country_id', 'is_active', 'createdAt', 'updatedAt'],
    properties: {
      phone_prefix_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del prefijo telefónico'
      },
      prefix: {
        type: 'string',
        example: '+56',
        description: 'Prefijo telefónico'
      },
      country_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del país'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el prefijo está activo'
      },
      country: {
        $ref: '#/components/schemas/CountryNested'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  ListPhonePrefixesResponse: {
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
        example: 'Prefijos telefónicos obtenidos exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/PhonePrefix'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  // ==================== AVATAR ====================

  AvatarThemeNested: {
    type: 'object',
    required: ['theme_id', 'name'],
    properties: {
      theme_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del tema'
      },
      name: {
        type: 'string',
        example: 'Animales',
        description: 'Nombre del tema'
      }
    }
  },

  Avatar: {
    type: 'object',
    required: ['avatar_id', 'name', 'image_url', 'theme_id', 'is_active', 'createdAt', 'updatedAt'],
    properties: {
      avatar_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del avatar'
      },
      name: {
        type: 'string',
        example: 'Robot Azul',
        description: 'Nombre del avatar'
      },
      image_url: {
        type: 'string',
        example: 'https://example.com/avatars/robot-azul.png',
        description: 'URL de la imagen del avatar'
      },
      theme_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del tema'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el avatar está activo'
      },
      theme: {
        $ref: '#/components/schemas/AvatarThemeNested'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  ListAvatarsResponse: {
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
        example: 'Avatares obtenidos exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Avatar'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  // ==================== AVATAR THEME ====================

  AvatarTheme: {
    type: 'object',
    required: ['theme_id', 'name', 'description', 'is_active', 'createdAt', 'updatedAt'],
    properties: {
      theme_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del tema'
      },
      name: {
        type: 'string',
        example: 'Animales',
        description: 'Nombre del tema'
      },
      description: {
        type: 'string',
        example: 'Avatares con diseños de animales',
        description: 'Descripción del tema'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el tema está activo'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  ListAvatarThemesResponse: {
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
        example: 'Temas de avatares obtenidos exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/AvatarTheme'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  // ==================== COUNTRY ====================

  Country: {
    type: 'object',
    required: ['country_id', 'name', 'code', 'is_active', 'createdAt', 'updatedAt'],
    properties: {
      country_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del país'
      },
      name: {
        type: 'string',
        example: 'Chile',
        description: 'Nombre del país'
      },
      code: {
        type: 'string',
        example: 'CL',
        description: 'Código ISO del país'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el país está activo'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  ListCountriesResponse: {
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
        example: 'Países obtenidos exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Country'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  // ==================== DEPARTMENT ====================

  DepartmentNested: {
    type: 'object',
    required: ['department_id', 'name'],
    properties: {
      department_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del departamento'
      },
      name: {
        type: 'string',
        example: 'Región Metropolitana',
        description: 'Nombre del departamento'
      }
    }
  },

  Department: {
    type: 'object',
    required: ['department_id', 'name', 'country_id', 'is_active', 'createdAt', 'updatedAt'],
    properties: {
      department_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del departamento'
      },
      name: {
        type: 'string',
        example: 'Región Metropolitana',
        description: 'Nombre del departamento'
      },
      country_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del país'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el departamento está activo'
      },
      country: {
        $ref: '#/components/schemas/CountryNested'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  ListDepartmentsResponse: {
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
        example: 'Departamentos obtenidos exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Department'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  // ==================== CITY ====================

  City: {
    type: 'object',
    required: ['city_id', 'name', 'department_id', 'is_active', 'createdAt', 'updatedAt'],
    properties: {
      city_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la ciudad'
      },
      name: {
        type: 'string',
        example: 'Puente Alto',
        description: 'Nombre de la ciudad'
      },
      department_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del departamento'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si la ciudad está activa'
      },
      department: {
        $ref: '#/components/schemas/DepartmentNested'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  ListCitiesResponse: {
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
        example: 'Ciudades obtenidas exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/City'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  // ==================== NOTIFICATION TYPE ====================

  NotificationType: {
    type: 'object',
    required: ['notification_type_id', 'code', 'name', 'description', 'supports_push', 'supports_email', 'priority', 'is_active', 'createdAt', 'updatedAt'],
    properties: {
      notification_type_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del tipo de notificación'
      },
      code: {
        type: 'string',
        example: 'PUSH_NOTIFICATION',
        description: 'Código del tipo de notificación'
      },
      name: {
        type: 'string',
        example: 'Notificación Push',
        description: 'Nombre del tipo de notificación'
      },
      description: {
        type: 'string',
        example: 'Notificaciones enviadas directamente al dispositivo',
        description: 'Descripción del tipo de notificación'
      },
      supports_push: {
        type: 'boolean',
        example: true,
        description: 'Indica si soporta notificaciones push'
      },
      supports_email: {
        type: 'boolean',
        example: false,
        description: 'Indica si soporta notificaciones por email'
      },
      priority: {
        type: 'integer',
        minimum: 1,
        maximum: 5,
        example: 1,
        description: 'Prioridad del tipo de notificación (1-5)'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el tipo de notificación está activo'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  ListNotificationTypesResponse: {
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
        example: 'Tipos de notificaciones obtenidos exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/NotificationType'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  // ==================== ROLE ====================

  Role: {
    type: 'object',
    required: ['role_id', 'name', 'description', 'is_active', 'createdAt', 'updatedAt'],
    properties: {
      role_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID del rol'
      },
      name: {
        type: 'string',
        example: 'Administrator',
        description: 'Nombre del rol'
      },
      description: {
        type: 'string',
        example: 'Acceso completo al sistema',
        description: 'Descripción del rol'
      },
      is_active: {
        type: 'boolean',
        example: true,
        description: 'Indica si el rol está activo'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de creación'
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z',
        description: 'Fecha de última actualización'
      }
    }
  },

  ListRolesResponse: {
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
        example: 'Roles obtenidos exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Role'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },

  // ==================== INSTITUTION ====================

  Institution: {
    type: 'object',
    required: ['institution_id', 'name', 'has_agreement', 'created_at', 'updated_at'],
    properties: {
      institution_id: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'ID de la institución'
      },
      name: {
        type: 'string',
        example: 'Universidad Nacional',
        description: 'Nombre de la institución'
      },
      has_agreement: {
        type: 'boolean',
        example: true,
        description: 'Indica si la institución tiene convenio'
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

  ListInstitutionsResponse: {
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
        example: 'Instituciones obtenidas exitosamente'
      },
      data: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Institution'
        }
      },
      metadata: {
        $ref: '#/components/schemas/CompleteMetadata'
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: '2024-01-17T10:30:00.000Z'
      }
    }
  },
};

module.exports = maintainersSchemas;