/**
 * Paths para KYC Social Networks
 */

const kycSocialNetworkPaths = {
  '/<admin>o<client>/api/kyc/social-networks': {
    get: {
      tags: ['KYC Social Networks - Shared'],
      summary: 'Obtener redes sociales del usuario',
      description: 'Obtiene todas las redes sociales asociadas al perfil del usuario autenticado',
      security: [
        {
          bearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Redes sociales obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SocialNetworkListResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Redes sociales obtenidas exitosamente',
                data: {
                  total: 2,
                  social_networks: [
                    {
                      person_social_network_id: '123e4567-e89b-12d3-a456-426614174000',
                      person_id: '123e4567-e89b-12d3-a456-426614174001',
                      provider: {
                        id: '123e4567-e89b-12d3-a456-426614174002',
                        name: 'Twitter',
                        icon_url: 'https://example.com/icons/twitter.png',
                        base_url: 'https://twitter.com',
                        is_active: true
                      },
                      username_handle: '@usuario123',
                      profile_url: 'https://twitter.com/usuario123',
                      is_verified: false,
                      created_at: '2024-01-17T10:30:00.000Z',
                      updated_at: '2024-01-17T10:30:00.000Z'
                    },
                    {
                      person_social_network_id: '123e4567-e89b-12d3-a456-426614174003',
                      person_id: '123e4567-e89b-12d3-a456-426614174001',
                      provider: {
                        id: '123e4567-e89b-12d3-a456-426614174004',
                        name: 'LinkedIn',
                        icon_url: 'https://example.com/icons/linkedin.png',
                        base_url: 'https://linkedin.com',
                        is_active: true
                      },
                      username_handle: 'usuario-profesional',
                      profile_url: 'https://linkedin.com/in/usuario-profesional',
                      is_verified: true,
                      created_at: '2024-01-17T11:00:00.000Z',
                      updated_at: '2024-01-17T11:00:00.000Z'
                    }
                  ]
                },
                timestamp: '2024-01-17T12:00:00.000Z'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        429: {
          $ref: '#/components/responses/RateLimitExceeded'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },
    post: {
      tags: ['KYC Social Networks - Shared'],
      summary: 'Agregar red social',
      description: 'Agrega una nueva red social al perfil del usuario autenticado',
      security: [
        {
          bearerAuth: []
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/AddSocialNetworkRequest'
            },
            examples: {
              withProfileUrl: {
                summary: 'Con URL de perfil',
                value: {
                  social_network_provider_id: '123e4567-e89b-12d3-a456-426614174000',
                  username_handle: '@usuario123',
                  profile_url: 'https://twitter.com/usuario123'
                }
              },
              withoutProfileUrl: {
                summary: 'Sin URL de perfil',
                value: {
                  social_network_provider_id: '123e4567-e89b-12d3-a456-426614174000',
                  username_handle: '@usuario123'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Red social agregada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AddSocialNetworkResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Red social agregada exitosamente',
                data: {
                  person_social_network_id: '123e4567-e89b-12d3-a456-426614174000',
                  person_id: '123e4567-e89b-12d3-a456-426614174001',
                  provider: {
                    id: '123e4567-e89b-12d3-a456-426614174002',
                    name: 'Twitter',
                    icon_url: 'https://example.com/icons/twitter.png',
                    base_url: 'https://twitter.com',
                    is_active: true
                  },
                  username_handle: '@usuario123',
                  profile_url: 'https://twitter.com/usuario123',
                  is_verified: false,
                  created_at: '2024-01-17T10:30:00.000Z',
                  updated_at: '2024-01-17T10:30:00.000Z'
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
        409: {
          description: 'Conflict - La red social ya existe',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 409,
                message: 'Ya tienes esta red social agregada',
                errorCode: 'CONFLICT',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
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
    },
    put: {
      tags: ['KYC Social Networks - Shared'],
      summary: 'Actualizar red social',
      description: 'Actualiza una red social existente del perfil del usuario autenticado',
      security: [
        {
          bearerAuth: []
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateSocialNetworkRequest'
            },
            examples: {
              updateUsernameAndUrl: {
                summary: 'Actualizar nombre de usuario y URL',
                value: {
                  person_social_network_id: '123e4567-e89b-12d3-a456-426614174000',
                  username_handle: '@usuario_actualizado',
                  profile_url: 'https://twitter.com/usuario_actualizado'
                }
              },
              updateOnlyUsername: {
                summary: 'Actualizar solo nombre de usuario',
                value: {
                  person_social_network_id: '123e4567-e89b-12d3-a456-426614174000',
                  username_handle: '@usuario_actualizado'
                }
              },
              removeProfileUrl: {
                summary: 'Eliminar URL de perfil',
                value: {
                  person_social_network_id: '123e4567-e89b-12d3-a456-426614174000',
                  profile_url: null
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Red social actualizada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateSocialNetworkResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Red social actualizada exitosamente',
                data: {
                  person_social_network_id: '123e4567-e89b-12d3-a456-426614174000',
                  person_id: '123e4567-e89b-12d3-a456-426614174001',
                  provider: {
                    id: '123e4567-e89b-12d3-a456-426614174002',
                    name: 'Twitter',
                    icon_url: 'https://example.com/icons/twitter.png',
                    base_url: 'https://twitter.com',
                    is_active: true
                  },
                  username_handle: '@usuario_actualizado',
                  profile_url: 'https://twitter.com/usuario_actualizado',
                  is_verified: false,
                  created_at: '2024-01-17T10:30:00.000Z',
                  updated_at: '2024-01-17T11:30:00.000Z'
                },
                timestamp: '2024-01-17T11:30:00.000Z'
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
          description: 'Forbidden - No tiene permiso para actualizar esta red social',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 403,
                message: 'No tienes permiso para actualizar esta red social',
                errorCode: 'FORBIDDEN',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        404: {
          description: 'Not Found - Red social no encontrada',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 404,
                message: 'Red social no encontrada',
                errorCode: 'NOT_FOUND',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
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
    },
    delete: {
      tags: ['KYC Social Networks - Shared'],
      summary: 'Eliminar red social',
      description: 'Elimina una red social del perfil del usuario autenticado',
      security: [
        {
          bearerAuth: []
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/DeleteSocialNetworkRequest'
            },
            example: {
              person_social_network_id: '123e4567-e89b-12d3-a456-426614174000'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Red social eliminada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DeleteSocialNetworkResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Red social eliminada exitosamente',
                data: null,
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
          description: 'Forbidden - No tiene permiso para eliminar esta red social',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 403,
                message: 'No tienes permiso para eliminar esta red social',
                errorCode: 'FORBIDDEN',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        404: {
          description: 'Not Found - Red social no encontrada',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                statusCode: 404,
                message: 'Red social no encontrada',
                errorCode: 'NOT_FOUND',
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
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
  }
};

module.exports = kycSocialNetworkPaths;