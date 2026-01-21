/**
 * Paths de Swagger para KYC Profile
 */

const kycProfilePaths = {
  '/<admin>o<client>/api/kyc/profile': {
    get: {
      tags: ['KYC Profile - Shared'],
      summary: 'Obtener perfil básico',
      description: 'Obtiene el perfil básico del usuario autenticado',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Perfil básico obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Perfil básico obtenido exitosamente' },
                  data: { $ref: '#/components/schemas/BasicProfileResponse' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    },
    put: {
      tags: ['KYC Profile - Shared'],
      summary: 'Actualizar perfil',
      description: 'Actualiza el perfil del usuario (username, avatar, ubicación, genero)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateProfileRequest' },
            examples: {
              updateUsername: {
                summary: 'Actualizar solo username',
                value: {
                  username: 'nuevo_usuario123'
                }
              },
              updateAvatar: {
                summary: 'Actualizar solo avatar',
                value: {
                  avatar_id: '123e4567-e89b-12d3-a456-426614174000'
                }
              },
              updateGender: {
                summary: 'Actualizar solo genero',
                value: {
                  gender_id: '123e4567-e89b-12d3-a456-426614174000'
                }
              },
              updateLocation: {
                summary: 'Actualizar solo ubicación',
                value: {
                  location: {
                    country_id: '123e4567-e89b-12d3-a456-426614174000',
                    department_id: '123e4567-e89b-12d3-a456-426614174000',
                    city_id: '123e4567-e89b-12d3-a456-426614174000',
                    address: 'Av. Principal 123',
                    postal_code: '12345',
                    type: 'Casa'
                  }
                }
              },
              updateAll: {
                summary: 'Actualizar múltiples campos',
                value: {
                  username: 'nuevo_usuario123',
                  avatar_id: '123e4567-e89b-12d3-a456-426614174000',
                  genrder_id: '123e4567-e89b-12d3-a456-426614174000',
                  location: {
                    country_id: '123e4567-e89b-12d3-a456-426614174000',
                    department_id: '123e4567-e89b-12d3-a456-426614174000',
                    city_id: '123e4567-e89b-12d3-a456-426614174000',
                    address: 'Av. Principal 123'
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Perfil actualizado exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Perfil actualizado exitosamente' },
                  data: { $ref: '#/components/schemas/ExtendedProfileResponse' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: { $ref: '#/components/responses/NotFound' },
        409: { $ref: '#/components/responses/Conflict' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/kyc/profile/extended': {
    get: {
      tags: ['KYC Profile - Shared'],
      summary: 'Obtener perfil extendido',
      description: 'Obtiene el perfil extendido del usuario autenticado (incluye ubicación, redes sociales, preferencias)',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Perfil extendido obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Perfil extendido obtenido exitosamente' },
                  data: { $ref: '#/components/schemas/ExtendedProfileResponse' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/kyc/profile/location': {
    get: {
      tags: ['KYC Profile - Shared'],
      summary: 'Obtener ubicación',
      description: 'Obtiene la información de ubicación del usuario',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Ubicación obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Ubicación obtenida exitosamente' },
                  data: { $ref: '#/components/schemas/LocationResponse' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/kyc/profile/contact': {
    get: {
      tags: ['KYC Profile - Shared'],
      summary: 'Obtener información de contacto',
      description: 'Obtiene la información de contacto del usuario (email, teléfonos)',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Información de contacto obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Información de contacto obtenida exitosamente' },
                  data: { $ref: '#/components/schemas/ContactInfoResponse' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/kyc/profile/email': {
    put: {
      tags: ['KYC Profile - Shared'],
      summary: 'Actualizar email',
      description: 'Actualiza el email del usuario (requiere verificación previa del nuevo email)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateEmailRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Email actualizado exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Email actualizado exitosamente' },
                  data: { $ref: '#/components/schemas/UpdateEmailResponse' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        409: { $ref: '#/components/responses/Conflict' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/kyc/profile/phone': {
    put: {
      tags: ['KYC Profile - Shared'],
      summary: 'Actualizar teléfono',
      description: 'Actualiza el teléfono del usuario (primario o secundario, requiere verificación previa)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdatePhoneRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Teléfono actualizado exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Teléfono actualizado exitosamente' },
                  data: { $ref: '#/components/schemas/UpdatePhoneResponse' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        409: { $ref: '#/components/responses/Conflict' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/kyc/profile/password': {
    put: {
      tags: ['KYC Profile - Shared'],
      summary: 'Actualizar contraseña',
      description: 'Actualiza la contraseña del usuario',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdatePasswordRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Contraseña actualizada exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Contraseña actualizada exitosamente' },
                  data: { type: 'object', nullable: true, example: null },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/kyc/profile/nationalId': {
    put: {
      tags: ['KYC Profile - Shared'],
      summary: 'Actualizar identificación nacional',
      description: 'Actualiza la identificación nacional del usuario',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UpdateNationalIdRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Identificación nacional actualizada exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Identificación nacional actualizada exitosamente' },
                  data: { $ref: '#/components/schemas/ChangeNationalIdResponse' },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        409: { $ref: '#/components/responses/Conflict' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/kyc/profile/delete-account': {
    delete: {
      tags: ['KYC Profile - Shared'],
      summary: 'Eliminar cuenta',
      description: 'Elimina la cuenta del usuario de forma permanente',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DeleteAccountRequest' }
          }
        }
      },
      responses: {
        200: {
          description: 'Cuenta eliminada exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  statusCode: { type: 'integer', example: 200 },
                  message: { type: 'string', example: 'Cuenta eliminada exitosamente' },
                  data: { type: 'object', nullable: true, example: null },
                  timestamp: { type: 'string', format: 'date-time' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  }
};

module.exports = kycProfilePaths;