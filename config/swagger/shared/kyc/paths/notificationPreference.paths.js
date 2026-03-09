
const notificationPreferencePaths = {
  '/<admin>o<client>/api/kyc/notification-preferences': {
    get: {
      tags: ['KYC Notification Preferences - shared'],
      summary: 'Obtener preferencias de notificación del usuario',
      description: 'Obtiene todas las preferencias de notificación configuradas por el usuario autenticado',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Preferencias obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/NotificationPreferenceListResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Preferencias de notificación obtenidas exitosamente',
                data: {
                  preferences: [
                    {
                      user_notification_preference_id: 1,
                      notification_type_code: null,
                      allow_push: true,
                      allow_email: true,
                      quiet_hours_start: '22:00',
                      quiet_hours_end: '08:00',
                      notification_type: null
                    },
                    {
                      user_notification_preference_id: 2,
                      notification_type_code: 'PAYMENT_RECEIVED',
                      allow_push: true,
                      allow_email: false,
                      quiet_hours_start: null,
                      quiet_hours_end: null,
                      notification_type: {
                        code: 'PAYMENT_RECEIVED',
                        name: 'Pago Recibido'
                      }
                    }
                  ],
                  total: 2
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    }
  },

  '/<admin>o<client>/api/kyc/notification-preferences/global': {
    put: {
      tags: ['KYC Notification Preferences - shared'],
      summary: 'Actualizar preferencia global de notificaciones',
      description: 'Actualiza la preferencia global de notificaciones del usuario (aquella sin tipo específico)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateGlobalPreferenceRequest'
            },
            examples: {
              updateAll: {
                summary: 'Actualizar todos los campos',
                value: {
                  allow_push: true,
                  allow_email: false,
                  quiet_hours_start: '22:00',
                  quiet_hours_end: '08:00'
                }
              },
              updateOnlyPush: {
                summary: 'Actualizar solo notificaciones push',
                value: {
                  allow_push: false
                }
              },
              updateQuietHours: {
                summary: 'Actualizar solo horario silencioso',
                value: {
                  quiet_hours_start: '23:00',
                  quiet_hours_end: '07:00'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Preferencia global actualizada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateGlobalPreferenceResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Preferencia global actualizada exitosamente',
                data: {
                  user_notification_preference_id: 1,
                  notification_type_code: null,
                  allow_push: true,
                  allow_email: false,
                  quiet_hours_start: '22:00',
                  quiet_hours_end: '08:00'
                },
                timestamp: '2024-01-17T10:30:00.000Z'
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

  '/<admin>o<client>/api/kyc/notification-preferences/type': {
    put: {
      tags: ['KYC Notification Preferences - shared'],
      summary: 'Crear o actualizar preferencia de tipo específico',
      description: 'Crea o actualiza una preferencia de notificación para un tipo específico de notificación',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/UpdateTypePreferenceRequest'
            },
            examples: {
              createPreference: {
                summary: 'Crear nueva preferencia de tipo',
                value: {
                  notification_type_code: 'PAYMENT_RECEIVED',
                  allow_push: true,
                  allow_email: false
                }
              },
              updatePreference: {
                summary: 'Actualizar preferencia existente',
                value: {
                  notification_type_code: 'PAYMENT_SENT',
                  allow_push: false,
                  allow_email: true
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Preferencia de tipo actualizada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateTypePreferenceResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Preferencia de tipo actualizada exitosamente',
                data: {
                  user_notification_preference_id: 2,
                  notification_type_code: 'PAYMENT_RECEIVED',
                  allow_push: true,
                  allow_email: false
                },
                timestamp: '2024-01-17T10:30:00.000Z'
              }
            }
          }
        },
        400: { $ref: '#/components/responses/BadRequest' },
        401: { $ref: '#/components/responses/Unauthorized' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' }
      }
    },
    delete: {
      tags: ['KYC Notification Preferences - shared'],
      summary: 'Eliminar preferencia de tipo específico',
      description: 'Elimina una preferencia de notificación para un tipo específico (revierte a la preferencia global)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/DeleteTypePreferenceRequest'
            },
            example: {
              notification_type_code: 'PAYMENT_RECEIVED'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Preferencia de tipo eliminada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/DeleteTypePreferenceResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Preferencia de tipo eliminada exitosamente',
                data: null,
                timestamp: '2024-01-17T10:30:00.000Z'
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
  },

  '/<admin>o<client>/api/kyc/notification-preferences/batch': {
    put: {
      tags: ['KYC Notification Preferences - shared'],
      summary: 'Actualizar múltiples preferencias de tipo en lote',
      description: 'Actualiza varias preferencias de notificación de tipos específicos en una sola operación',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/BatchUpdateTypePreferencesRequest'
            },
            example: {
              preferences: [
                {
                  notification_type_code: 'PAYMENT_RECEIVED',
                  allow_push: true,
                  allow_email: false
                },
                {
                  notification_type_code: 'PAYMENT_SENT',
                  allow_push: false,
                  allow_email: true
                },
                {
                  notification_type_code: 'TRANSFER_COMPLETED',
                  allow_push: true,
                  allow_email: true
                }
              ]
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Preferencias actualizadas exitosamente en lote',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/BatchUpdateTypePreferencesResponse'
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Preferencias actualizadas exitosamente en lote',
                data: {
                  updated: 3,
                  preferences: [
                    {
                      user_notification_preference_id: 2,
                      notification_type_code: 'PAYMENT_RECEIVED',
                      allow_push: true,
                      allow_email: false,
                      quiet_hours_start: null,
                      quiet_hours_end: null,
                      notification_type: {
                        code: 'PAYMENT_RECEIVED',
                        name: 'Pago Recibido'
                      }
                    },
                    {
                      user_notification_preference_id: 3,
                      notification_type_code: 'PAYMENT_SENT',
                      allow_push: false,
                      allow_email: true,
                      quiet_hours_start: null,
                      quiet_hours_end: null,
                      notification_type: {
                        code: 'PAYMENT_SENT',
                        name: 'Pago Enviado'
                      }
                    },
                    {
                      user_notification_preference_id: 4,
                      notification_type_code: 'TRANSFER_COMPLETED',
                      allow_push: true,
                      allow_email: true,
                      quiet_hours_start: null,
                      quiet_hours_end: null,
                      notification_type: {
                        code: 'TRANSFER_COMPLETED',
                        name: 'Transferencia Completada'
                      }
                    }
                  ]
                },
                timestamp: '2024-01-17T10:30:00.000Z'
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
  }
};

module.exports = notificationPreferencePaths;