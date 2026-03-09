/**
 * Paths de Swagger para el módulo KYC Profile
 * Define todos los endpoints relacionados con el perfil KYC del usuario
 */

const profilePaths = {
  // ==================== GET PROFILE COMPLETENESS ====================
  '/client/api/kyc/profile/completeness': {
    get: {
      tags: ['KYC Profile - Client'],
      summary: 'Obtener completitud del perfil',
      description: `Obtiene el porcentaje de completitud del perfil del usuario autenticado.
      
**Funcionalidad:**
- Calcula el porcentaje de completitud basado en campos requeridos
- Muestra qué campos están completos y cuáles faltan
- Si el perfil está 100% completo, automáticamente upgradea el rol del usuario a USER_VERIFIED
- Envía notificación cuando se completa el perfil

**Requisitos:**
- Usuario debe estar autenticado
- Sesión válida

**Comportamiento de upgrade automático:**
- Si percentage = 100 y rol actual != USER_VERIFIED → actualiza a USER_VERIFIED
- Si ya tiene USER_VERIFIED → no hace nada
- Envía notificación tipo 'PROFILE_COMPLETED' al completar`,
      operationId: 'getProfileCompleteness',
      security: [
        {
          BearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Completitud de perfil obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ProfileCompletenessResponse'
              },
              examples: {
                perfilIncompleto: {
                  summary: 'Perfil incompleto (75%)',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Completitud de perfil obtenida exitosamente',
                    data: {
                      percentage: 75.5,
                      isComplete: false,
                      completedFields: 8,
                      missingFields: 3,
                      details: {
                        personalInfo: {
                          isComplete: true,
                          completedFields: ['first_name', 'last_name', 'birth_date'],
                          missingFields: []
                        },
                        contactInfo: {
                          isComplete: false,
                          completedFields: ['email'],
                          missingFields: ['phone_number']
                        },
                        addressInfo: {
                          isComplete: true,
                          completedFields: ['region', 'comuna', 'street_address'],
                          missingFields: []
                        },
                        identificationInfo: {
                          isComplete: false,
                          completedFields: ['rut'],
                          missingFields: ['passport_number']
                        }
                      }
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                },
                perfilCompleto: {
                  summary: 'Perfil completo (100%) - Usuario upgradeado',
                  value: {
                    success: true,
                    statusCode: 200,
                    message: 'Completitud de perfil obtenida exitosamente',
                    data: {
                      percentage: 100,
                      isComplete: true,
                      completedFields: 11,
                      missingFields: 0,
                      details: {
                        personalInfo: {
                          isComplete: true,
                          completedFields: ['first_name', 'last_name', 'birth_date'],
                          missingFields: []
                        },
                        contactInfo: {
                          isComplete: true,
                          completedFields: ['email', 'phone_number'],
                          missingFields: []
                        },
                        addressInfo: {
                          isComplete: true,
                          completedFields: ['region', 'comuna', 'street_address'],
                          missingFields: []
                        },
                        identificationInfo: {
                          isComplete: true,
                          completedFields: ['rut', 'passport_number'],
                          missingFields: []
                        }
                      }
                    },
                    timestamp: '2024-01-17T10:30:00.000Z'
                  }
                }
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },
};

module.exports = profilePaths;