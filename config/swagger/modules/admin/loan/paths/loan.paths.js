'use strict';

/**
 * Paths Swagger — Admin Loans
 * Base: /admin/api/loans
 */

const loanAdminPaths = {

  // ─────────────────────────────────────────────────────────────────────────
  // GET /admin/api/loans
  // ─────────────────────────────────────────────────────────────────────────
  '/admin/api/loans': {
    get: {
      tags: ['Admin - Loans'],
      summary: 'Listar todos los préstamos',
      description: 'Retorna la lista paginada de todos los préstamos del sistema. Requiere rol `admin` o `super_admin`.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Página a consultar',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          description: 'Cantidad de elementos por página',
        },
        {
          name: 'status',
          in: 'query',
          schema: { $ref: '#/components/schemas/LoanStatus' },
          description: 'Filtrar por estado del préstamo',
        },
        {
          name: 'is_student_loan',
          in: 'query',
          schema: { type: 'boolean' },
          description: 'Filtrar por préstamos estudiantiles',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Búsqueda por nombre, RUT u otros campos del deudor',
        },
      ],
      responses: {
        200: {
          description: 'Lista paginada de préstamos obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/LoanListItem' },
                      },
                      metadata: { $ref: '#/components/schemas/CompleteMetadata' },
                    },
                  },
                ],
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  '/admin/api/loans/rate/schedule/eligible-for-rate-change': {
    get: {
      tags: ['Admin - Rate Changes'],
      summary: 'Listar préstamos elegibles para modificación de tasas',
      description: `Retorna la lista paginada de préstamos **activos** cuya primera cuota 
        ya venció o vence en el mes actual (due_date cuota 1 <= inicio del mes actual). 
        Estos son los únicos préstamos sobre los que se puede solicitar un cambio de tasas. 
        Requiere rol \`admin\` o \`super_admin\`.`,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
          description: 'Página a consultar',
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
          description: 'Cantidad de elementos por página',
        },
        {
          name: 'search',
          in: 'query',
          schema: { type: 'string' },
          description: 'Búsqueda por nombre del deudor, código o nombre de producto',
        },
      ],
      responses: {
        200: {
          description: 'Lista paginada de préstamos elegibles obtenida exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/LoanListItem' },
                      },
                      metadata: { $ref: '#/components/schemas/CompleteMetadata' },
                    },
                  },
                ],
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /admin/api/loans/change-requests/scheduled
  // (debe ir ANTES de /:loan_id para que Express no lo confunda)
  // ─────────────────────────────────────────────────────────────────────────
  '/admin/api/loans/change-requests/scheduled': {
    get: {
      tags: ['Admin - Rate Changes'],
      summary: 'Listar cambios de tasas programados',
      description: 'Retorna la lista paginada de todos los cambios de tasas programados. Solo `admin` y `super_admin`.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer', minimum: 1, default: 1 },
        },
        {
          name: 'limit',
          in: 'query',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        },
        {
          name: 'status',
          in: 'query',
          schema: { $ref: '#/components/schemas/RateChangeScheduleStatus' },
          description: 'Filtrar por estado del cambio programado',
        },
        {
          name: 'loan_id',
          in: 'query',
          schema: { type: 'string', format: 'uuid' },
          description: 'Filtrar por préstamo',
        },
      ],
      responses: {
        200: {
          description: 'Lista de cambios de tasas programados',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/RateChangeScheduleItem' },
                      },
                      metadata: { $ref: '#/components/schemas/CompleteMetadata' },
                    },
                  },
                ],
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST /admin/api/loans/change-requests/{changeRequestId}/approve
  // ─────────────────────────────────────────────────────────────────────────
  '/admin/api/loans/change-requests/{changeRequestId}/approve': {
    post: {
      tags: ['Admin - Rate Changes'],
      summary: 'Aprobar cambio de tasas programado',
      description: `Aprueba un cambio de tasas pendiente. 
**Requiere un segundo administrador distinto al que lo creó** (doble aprobación).
Una vez aprobado, el cambio se aplica automáticamente el día 10 del siguiente mes.`,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'changeRequestId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID de la solicitud de cambio',
        },
      ],
      responses: {
        200: {
          description: 'Cambio de tasas aprobado exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/ApproveRateChangeResponse' },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: 'La solicitud ya fue procesada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                statusCode: 400,
                message: 'Esta solicitud ya fue procesada',
                errorCode: 'BAD_REQUEST',
              },
            },
          },
        },
        403: {
          description: 'No puedes aprobar tus propios cambios',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                statusCode: 403,
                message: 'No puedes aprobar tus propios cambios',
                errorCode: 'FORBIDDEN',
              },
            },
          },
        },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST /admin/api/loans/change-requests/{changeRequestId}/cancel
  // ─────────────────────────────────────────────────────────────────────────
  '/admin/api/loans/change-requests/{changeRequestId}/cancel': {
    post: {
      tags: ['Admin - Rate Changes'],
      summary: 'Cancelar solicitud de cambio de tasas pendiente',
      description: `Cancela una solicitud de cambio de tasas que aún no ha sido aprobada.
**Requiere un administrador distinto al que la creó.**
Al cancelar, tanto la solicitud de cambio como el schedule asociado quedan en estado cancelado.`,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'changeRequestId',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID de la solicitud de cambio a cancelar',
        },
      ],
      responses: {
        200: {
          description: 'Solicitud de cambio de tasas cancelada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/CancelChangeRequestResponse' },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: 'La solicitud ya fue procesada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                statusCode: 400,
                message: 'Esta solicitud ya fue procesada',
                errorCode: 'BAD_REQUEST',
              },
            },
          },
        },
        403: {
          description: 'No puedes cancelar tus propios cambios',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                statusCode: 403,
                message: 'No puedes cancelar tus propios cambios',
                errorCode: 'FORBIDDEN',
              },
            },
          },
        },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST /admin/api/loans/change-requests/{schedule_id}/cancel
  // ─────────────────────────────────────────────────────────────────────────
  '/admin/api/loans/rate/schedule/{schedule_id}/cancel': {
    post: {
      tags: ['Admin - Rate Changes'],
      summary: 'Cancelar cambio de tasas programado',
      description: 'Cancela un cambio de tasas que esté en estado `pending`. No se puede cancelar si ya fue aplicado.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'schedule_id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID del cambio programado',
        },
      ],
      responses: {
        200: {
          description: 'Cambio de tasas cancelado exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/CancelRateChangeResponse' },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: 'El cambio ya fue aplicado o cancelado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                statusCode: 400,
                message: 'Este cambio ya fue aplicado o cancelado',
                errorCode: 'BAD_REQUEST',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /admin/api/loans/{loan_id}
  // ─────────────────────────────────────────────────────────────────────────
  '/admin/api/loans/{loan_id}': {
    get: {
      tags: ['Admin - Loans'],
      summary: 'Obtener detalle de un préstamo',
      description: 'Retorna el detalle completo de un préstamo, incluyendo información técnica y de desembolso.',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'loan_id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID del préstamo',
        },
      ],
      responses: {
        200: {
          description: 'Detalle del préstamo obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/LoanAdminDetail' },
                    },
                  },
                ],
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST /admin/api/loans/{loan_id}/disburse
  // ─────────────────────────────────────────────────────────────────────────
  '/admin/api/loans/{loan_id}/disburse': {
    post: {
      tags: ['Admin - Loans'],
      summary: 'Desembolsar préstamo manualmente',
      description: `Desembolsa un préstamo estudiantil de forma manual.
  - Solo aplica a préstamos con \`status: pending_disbursement\`
  - Solo aplica a préstamos con \`is_student_loan: true\`
  - El \`student_email\` se obtiene automáticamente del email institucional activo del deudor
  - No es necesario enviarlo en el body — queda registrado en \`loan_disbursements\``,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'loan_id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID del préstamo',
        },
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/DisburseLoanBody' },
          },
        },
      },
      responses: {
        200: {
          description: 'Préstamo desembolsado exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/DisburseLoanResponse' },
                    },
                  },
                ],
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Préstamo desembolsado exitosamente',
                data: {
                  loan_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  status: 'active',
                  disbursed_at: '2025-01-15T10:00:00.000Z',
                  student_email: 'juan.perez@uchile.cl',
                  message: 'Préstamo desembolsado exitosamente',
                },
              },
            },
          },
        },
        400: {
          description: 'El préstamo no está en estado correcto o no es estudiantil',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                notPendingDisbursement: {
                  summary: 'Préstamo no está pendiente de desembolso',
                  value: { success: false, statusCode: 400, message: 'Este préstamo no está pendiente de desembolso', errorCode: 'BAD_REQUEST' },
                },
                notStudentLoan: {
                  summary: 'No es un préstamo estudiantil',
                  value: { success: false, statusCode: 400, message: 'Solo los préstamos estudiantiles requieren desembolso manual', errorCode: 'BAD_REQUEST' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST /admin/api/loans/{loan_id}/rates/schedule
  // ─────────────────────────────────────────────────────────────────────────
  '/admin/api/loans/{loan_id}/rates/schedule': {
    post: {
      tags: ['Admin - Rate Changes'],
      summary: 'Programar cambio de tasas',
      description: `Programa un cambio de tasas para un préstamo activo.
- Solo aplica a préstamos \`active\`
- La primera cuota debe haber pasado su fecha de vencimiento
- Requiere aprobación de un segundo administrador distinto
- Se aplica automáticamente el día 10 del siguiente mes`,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'loan_id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID del préstamo',
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['new_rates', 'change_description'],
              properties: {
                new_rates: { $ref: '#/components/schemas/NewRatesBody' },
                change_description: {
                  type: 'string',
                  example: 'Reducción de tasa por buen comportamiento de pago',
                  description: 'Descripción del motivo del cambio',
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Cambio de tasas programado, pendiente de aprobación',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/ScheduleRateChangeResponse' },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: 'Préstamo no activo, primera cuota no vencida, o ya hay un cambio pendiente',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                notActive: {
                  summary: 'Préstamo no activo',
                  value: { success: false, statusCode: 400, message: 'Solo se pueden modificar tasas de préstamos activos', errorCode: 'BAD_REQUEST' },
                },
                pendingChange: {
                  summary: 'Ya existe un cambio pendiente',
                  value: { success: false, statusCode: 400, message: 'Ya existe un cambio de tasas pendiente para este préstamo', errorCode: 'BAD_REQUEST' },
                },
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /admin/api/loans/{loan_id}/late-charges
  // ─────────────────────────────────────────────────────────────────────────
  '/admin/api/loans/{loan_id}/late-charges': {
    get: {
      tags: ['Admin - Late Charges (Mora)'],
      summary: 'Resumen de mora del préstamo agrupado por cuota',
      description: `Retorna el historial de mora del préstamo agrupado por cuota.
Incluye totales acumulados (mora, cobranza, legal) y el máximo de días de atraso por cuota.
Esta vista es ideal para un **panel de resumen** de mora.`,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'loan_id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID del préstamo',
        },
      ],
      responses: {
        200: {
          description: 'Historial de mora obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/LoanLateChargeHistory' },
                    },
                  },
                ],
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Historial de mora obtenido exitosamente',
                data: {
                  loan_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  totals: {
                    total_penalty: 27000.00,
                    total_collection: 8100.00,
                    total_legal: 0.00,
                    grand_total: 35100.00,
                    total_charge_days: 18,
                  },
                  installments_summary: [
                    {
                      installment_number: 2,
                      total_charge_days: 18,
                      max_days_late: 18,
                      first_charge_date: '2025-03-11',
                      last_charge_date: '2025-03-28',
                      total_penalty: 27000.00,
                      total_collection: 8100.00,
                      total_legal: 0.00,
                      grand_total: 35100.00,
                    },
                  ],
                },
                timestamp: '2025-02-11T10:00:00.000Z',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /admin/api/loans/{loan_id}/late-charges/daily
  // ─────────────────────────────────────────────────────────────────────────
  '/admin/api/loans/{loan_id}/late-charges/daily': {
    get: {
      tags: ['Admin - Late Charges (Mora)'],
      summary: 'Historial diario de cobros de mora',
      description: `Retorna el detalle día a día de todos los cobros de mora del préstamo.
Incluye \`rate_snapshot_used\` para auditoría completa (solo admin).
Soporta filtros por rango de fechas o por número de cuota.`,
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'loan_id',
          in: 'path',
          required: true,
          schema: { type: 'string', format: 'uuid' },
          description: 'ID del préstamo',
        },
        {
          name: 'installment_number',
          in: 'query',
          schema: { type: 'integer', minimum: 1 },
          description: 'Filtrar cobros por número de cuota específica',
        },
        {
          name: 'from_date',
          in: 'query',
          schema: { type: 'string', format: 'date', example: '2025-03-01' },
          description: 'Fecha de inicio del rango (YYYY-MM-DD)',
        },
        {
          name: 'to_date',
          in: 'query',
          schema: { type: 'string', format: 'date', example: '2025-03-31' },
          description: 'Fecha de fin del rango (YYYY-MM-DD)',
        },
      ],
      responses: {
        200: {
          description: 'Historial diario de mora obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/LoanLateChargeDailyListAdmin' },
                    },
                  },
                ],
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Historial diario de mora obtenido exitosamente',
                data: {
                  loan_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  charges: [
                    {
                      late_charge_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
                      installment_number: 2,
                      charged_date: '2025-03-11',
                      days_late: 1,
                      penalty_charged: 1500.00,
                      collection_charged: 0.00,
                      legal_charged: 0.00,
                      total_charged: 1500.00,
                      rate_snapshot_used: {
                        apr: 24.5,
                        grace_period_days: 5,
                        late_threshold_days: 30,
                        collection_threshold_days: 60,
                        penalty_rate: 0.03,
                        collection_rate: 0.015,
                        legal_rate: 0.025,
                      },
                    },
                  ],
                },
                timestamp: '2025-02-11T10:00:00.000Z',
              },
            },
          },
        },
        401: { $ref: '#/components/responses/Unauthorized' },
        403: { $ref: '#/components/responses/Forbidden' },
        404: { $ref: '#/components/responses/NotFound' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
};

module.exports = loanAdminPaths;