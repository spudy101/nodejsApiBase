const commonSchemas = require('./common.schemas');

const kycNotificationPreferenceSchemas = {
  // ==================== ENTITIES ====================

  NotificationPreference: {
    type: 'object',
    properties: {
      user_notification_preference_id: {
        type: 'integer',
        example: 1,
        description: 'ID de la preferencia de notificación'
      },
      notification_type_code: {
        type: 'string',
        nullable: true,
        example: 'PAYMENT_RECEIVED',
        description: 'Código del tipo de notificación (null para preferencia global)'
      },
      allow_push: {
        type: 'boolean',
        example: true,
        description: 'Permitir notificaciones push'
      },
      allow_email: {
        type: 'boolean',
        example: true,
        description: 'Permitir notificaciones por email'
      },
      quiet_hours_start: {
        type: 'string',
        nullable: true,
        pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
        example: '22:00',
        description: 'Hora de inicio del modo silencioso (formato HH:MM)'
      },
      quiet_hours_end: {
        type: 'string',
        nullable: true,
        pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
        example: '08:00',
        description: 'Hora de fin del modo silencioso (formato HH:MM)'
      },
      notification_type: {
        type: 'object',
        nullable: true,
        description: 'Información del tipo de notificación',
        properties: {
          code: {
            type: 'string',
            example: 'PAYMENT_RECEIVED',
            description: 'Código del tipo de notificación'
          },
          name: {
            type: 'string',
            example: 'Pago Recibido',
            description: 'Nombre del tipo de notificación'
          }
        }
      }
    }
  },

  // ==================== REQUEST BODIES ====================

  UpdateGlobalPreferenceRequest: {
    type: 'object',
    properties: {
      allow_push: {
        type: 'boolean',
        example: true,
        description: 'Permitir notificaciones push'
      },
      allow_email: {
        type: 'boolean',
        example: true,
        description: 'Permitir notificaciones por email'
      },
      quiet_hours_start: {
        type: 'string',
        pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
        example: '22:00',
        description: 'Hora de inicio del modo silencioso (formato HH:MM)'
      },
      quiet_hours_end: {
        type: 'string',
        pattern: '^([01]\\d|2[0-3]):([0-5]\\d)$',
        example: '08:00',
        description: 'Hora de fin del modo silencioso (formato HH:MM)'
      }
    },
    description: 'Al menos un campo es requerido'
  },

  UpdateTypePreferenceRequest: {
    type: 'object',
    required: ['notification_type_code'],
    properties: {
      notification_type_code: {
        type: 'string',
        maxLength: 50,
        example: 'PAYMENT_RECEIVED',
        description: 'Código del tipo de notificación'
      },
      allow_push: {
        type: 'boolean',
        example: true,
        description: 'Permitir notificaciones push'
      },
      allow_email: {
        type: 'boolean',
        example: true,
        description: 'Permitir notificaciones por email'
      }
    }
  },

  DeleteTypePreferenceRequest: {
    type: 'object',
    required: ['notification_type_code'],
    properties: {
      notification_type_code: {
        type: 'string',
        maxLength: 50,
        example: 'PAYMENT_RECEIVED',
        description: 'Código del tipo de notificación a eliminar'
      }
    }
  },

  BatchUpdateTypePreferencesRequest: {
    type: 'object',
    required: ['preferences'],
    properties: {
      preferences: {
        type: 'array',
        minItems: 1,
        description: 'Array de preferencias a actualizar',
        items: {
          type: 'object',
          required: ['notification_type_code'],
          properties: {
            notification_type_code: {
              type: 'string',
              maxLength: 50,
              example: 'PAYMENT_RECEIVED',
              description: 'Código del tipo de notificación'
            },
            allow_push: {
              type: 'boolean',
              example: true,
              description: 'Permitir notificaciones push'
            },
            allow_email: {
              type: 'boolean',
              example: true,
              description: 'Permitir notificaciones por email'
            }
          }
        }
      }
    }
  },

  // ==================== RESPONSE DATA ====================

  NotificationPreferenceListResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              preferences: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/NotificationPreference'
                }
              },
              total: {
                type: 'integer',
                example: 5,
                description: 'Total de preferencias'
              }
            }
          }
        }
      }
    ]
  },

  UpdateGlobalPreferenceResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              user_notification_preference_id: {
                type: 'integer',
                example: 1
              },
              notification_type_code: {
                type: 'string',
                nullable: true,
                example: null
              },
              allow_push: {
                type: 'boolean',
                example: true
              },
              allow_email: {
                type: 'boolean',
                example: true
              },
              quiet_hours_start: {
                type: 'string',
                nullable: true,
                example: '22:00'
              },
              quiet_hours_end: {
                type: 'string',
                nullable: true,
                example: '08:00'
              }
            }
          }
        }
      }
    ]
  },

  UpdateTypePreferenceResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              user_notification_preference_id: {
                type: 'integer',
                example: 2
              },
              notification_type_code: {
                type: 'string',
                example: 'PAYMENT_RECEIVED'
              },
              allow_push: {
                type: 'boolean',
                example: true
              },
              allow_email: {
                type: 'boolean',
                example: false
              }
            }
          }
        }
      }
    ]
  },

  DeleteTypePreferenceResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            nullable: true,
            example: null
          }
        }
      }
    ]
  },

  BatchUpdateTypePreferencesResponse: {
    allOf: [
      { $ref: '#/components/schemas/SuccessResponse' },
      {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              updated: {
                type: 'integer',
                example: 3,
                description: 'Cantidad de preferencias actualizadas'
              },
              preferences: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/NotificationPreference'
                }
              }
            }
          }
        }
      }
    ]
  }
};

module.exports = kycNotificationPreferenceSchemas;