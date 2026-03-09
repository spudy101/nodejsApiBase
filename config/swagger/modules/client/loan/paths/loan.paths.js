'use strict';

/**
 * Paths Swagger — Client Loans
 * Base: /client/api/loans
 */

const loanClientPaths = {

  // ─────────────────────────────────────────────────────────────────────────
  // GET /client/api/loans
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans': {
    get: {
      tags: ['Client - Loans'],
      summary: 'Listar mis préstamos',
      description: 'Retorna la lista paginada de los préstamos del usuario autenticado.',
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
      ],
      responses: {
        200: {
          description: 'Lista paginada de mis préstamos obtenida exitosamente',
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
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /client/api/loans/{loan_id}
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/{loan_id}': {
    get: {
      tags: ['Client - Loans'],
      summary: 'Obtener detalle de mi préstamo',
      description: 'Retorna el detalle completo de uno de mis préstamos. Solo puede acceder el titular del préstamo.',
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
                      data: { $ref: '#/components/schemas/LoanDetail' },
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
  // POST /client/api/loans/{loan_id}/insurance/pay
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/{loan_id}/insurance/pay': {
    post: {
      tags: ['Client - Payments'],
      summary: 'Iniciar pago de seguro',
      description: `Inicia el pago del seguro del préstamo a través de MercadoPago.
- El préstamo debe estar en estado \`pending_insurance\`
- Retorna un \`init_point\` al que debe redirigirse al usuario
- El estado del pago se actualiza vía webhook de MercadoPago`,
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
          description: 'Pago de seguro iniciado. Redirigir al usuario al init_point.',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/InitiateInsurancePaymentResponse' },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: 'El préstamo no está pendiente de seguro o ya fue pagado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                notPendingInsurance: {
                  summary: 'Estado incorrecto',
                  value: { success: false, statusCode: 400, message: 'Este préstamo no está pendiente de pago de seguro', errorCode: 'BAD_REQUEST' },
                },
                alreadyPaid: {
                  summary: 'Seguro ya pagado',
                  value: { success: false, statusCode: 400, message: 'El seguro de este préstamo ya fue pagado', errorCode: 'BAD_REQUEST' },
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
  // GET /client/api/loans/{loan_id}/installments
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/{loan_id}/installments': {
    get: {
      tags: ['Client - Installments'],
      summary: 'Listar cuotas de mi préstamo',
      description: 'Retorna todas las cuotas del préstamo, ordenadas por número de cuota.',
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
          description: 'Lista de cuotas obtenida exitosamente',
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
                        items: { $ref: '#/components/schemas/InstallmentListItem' },
                      },
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
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /client/api/loans/{loan_id}/installments/{installment_number}
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/{loan_id}/installments/{installment_number}': {
    get: {
      tags: ['Client - Installments'],
      summary: 'Obtener detalle de una cuota',
      description: 'Retorna el detalle de una cuota específica, incluyendo el desglose de penalizaciones si aplica.',
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
          in: 'path',
          required: true,
          schema: { type: 'integer', minimum: 1 },
          description: 'Número de cuota',
        },
      ],
      responses: {
        200: {
          description: 'Detalle de la cuota obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/InstallmentDetail' },
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
  // POST /client/api/loans/{loan_id}/installments/{installment_number}/pay
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/{loan_id}/installments/{installment_number}/pay': {
    post: {
      tags: ['Client - Payments'],
      summary: 'Iniciar pago de cuota',
      description: `Inicia el pago de una cuota específica a través de MercadoPago.
- El préstamo debe estar \`active\`
- La cuota debe estar en estado \`PENDING\`
- El monto cobrado incluye principal + intereses + mora acumulada si hay atraso
- Retorna un \`init_point\` al que debe redirigirse al usuario`,
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
          in: 'path',
          required: true,
          schema: { type: 'integer', minimum: 1 },
          description: 'Número de cuota a pagar',
        },
      ],
      responses: {
        200: {
          description: 'Pago de cuota iniciado. Redirigir al usuario al init_point.',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/InitiateInstallmentPaymentResponse' },
                    },
                  },
                ],
              },
            },
          },
        },
        400: {
          description: 'Préstamo no activo, cuota no pendiente, o ya fue pagada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                notActive: {
                  summary: 'Préstamo no activo',
                  value: { success: false, statusCode: 400, message: 'Este préstamo no está activo', errorCode: 'BAD_REQUEST' },
                },
                notPending: {
                  summary: 'Cuota no pendiente',
                  value: { success: false, statusCode: 400, message: 'Esta cuota no está pendiente de pago', errorCode: 'BAD_REQUEST' },
                },
                alreadyPaid: {
                  summary: 'Cuota ya pagada',
                  value: { success: false, statusCode: 400, message: 'Esta cuota ya fue pagada', errorCode: 'BAD_REQUEST' },
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
  // GET /client/api/loans/{loan_id}/payments
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/{loan_id}/payments': {
    get: {
      tags: ['Client - Payments'],
      summary: 'Listar pagos de mi préstamo',
      description: 'Retorna el historial de pagos (seguros y cuotas) del préstamo.',
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
          description: 'Historial de pagos obtenido exitosamente',
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
                        items: { $ref: '#/components/schemas/PaymentListItem' },
                      },
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
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /client/api/loans/statistics
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/statistics': {
    get: {
      tags: ['Client - Loans'],
      summary: 'Obtener estadísticas de mis préstamos',
      description: 'Retorna un resumen estadístico de los préstamos: cuotas pagadas, pendientes, saldo pendiente, mora acumulada, etc.',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Estadísticas de los préstamos obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/LoanGlobalStatisticsResponse' },
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
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // GET /client/api/loans/{loan_id}/late-charges
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/{loan_id}/late-charges': {
    get: {
      tags: ['Client - Late Charges (Mora)'],
      summary: 'Resumen de mora de mi préstamo',
      description: `Retorna el historial de mora agrupado por cuota para el usuario autenticado.
Muestra cuánta mora acumuló cada cuota, días de atraso y totales.
Solo visible para el titular del préstamo. No incluye datos internos de tasas.`,
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
  // GET /client/api/loans/{loan_id}/late-charges/daily
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/{loan_id}/late-charges/daily': {
    get: {
      tags: ['Client - Late Charges (Mora)'],
      summary: 'Historial diario de cobros de mora',
      description: `Retorna el detalle día a día de los cobros de mora del préstamo.
Permite al cliente ver exactamente qué se le cobró cada día.
No incluye datos internos de tasas (\`rate_snapshot_used\`).
Filtrable por cuota específica.`,
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
                      data: { $ref: '#/components/schemas/LoanLateChargeDailyList' },
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
        422: { $ref: '#/components/responses/ValidationError' },
        500: { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // POST /client/api/loans/{loan_id}/insurance/pay-with-balance
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/{loan_id}/insurance/pay-with-balance': {
    post: {
      tags: ['Client - Payments'],
      summary: 'Pagar seguro con saldo de cuenta',
      description: `Paga el seguro del préstamo directamente usando el saldo de la cuenta interna del usuario.
  - El préstamo debe estar en estado \`pending_insurance\`
  - Se verifica que haya saldo suficiente antes de ejecutar
  - Si el saldo es insuficiente retorna 400 y registra el intento fallido en el historial
  - Si el pago es exitoso, el préstamo avanza de estado de forma inmediata (sin webhook)
  - Para préstamos normales: pasa a \`active\` y se acredita el monto en la cuenta
  - Para préstamos estudiantiles: pasa a \`pending_disbursement\``,
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
          description: 'Seguro pagado exitosamente con saldo de cuenta',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/PayWithBalanceResponse' },
                    },
                  },
                ],
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Seguro pagado exitosamente con saldo de cuenta',
                data: {
                  loan_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  payment_id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
                  payment_type: 'insurance',
                  payment_method: 'account_balance',
                  amount_paid: 17850.00,
                  loan_status: 'active',
                },
              },
            },
          },
        },
        400: {
          description: 'Saldo insuficiente, cuenta inactiva, estado incorrecto o seguro ya pagado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                insufficientBalance: {
                  summary: 'Saldo insuficiente',
                  value: { success: false, statusCode: 400, message: 'Saldo insuficiente para realizar este pago', errorCode: 'BAD_REQUEST' },
                },
                accountNotActive: {
                  summary: 'Cuenta inactiva',
                  value: { success: false, statusCode: 400, message: 'Tu cuenta no está activa', errorCode: 'BAD_REQUEST' },
                },
                notPendingInsurance: {
                  summary: 'Estado incorrecto',
                  value: { success: false, statusCode: 400, message: 'Este préstamo no está pendiente de pago de seguro', errorCode: 'BAD_REQUEST' },
                },
                alreadyPaid: {
                  summary: 'Seguro ya pagado',
                  value: { success: false, statusCode: 400, message: 'El seguro de este préstamo ya fue pagado', errorCode: 'BAD_REQUEST' },
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
  // POST /client/api/loans/{loan_id}/installments/{installment_number}/pay-with-balance
  // ─────────────────────────────────────────────────────────────────────────
  '/client/api/loans/{loan_id}/installments/{installment_number}/pay-with-balance': {
    post: {
      tags: ['Client - Payments'],
      summary: 'Pagar cuota con saldo de cuenta',
      description: `Paga una cuota específica directamente usando el saldo de la cuenta interna del usuario.
  - El préstamo debe estar \`active\`
  - La cuota debe estar en estado \`PENDING\`
  - El monto cobrado incluye principal + intereses + mora acumulada si hay atraso
  - Se verifica que haya saldo suficiente antes de ejecutar
  - Si el saldo es insuficiente retorna 400 y registra el intento fallido en el historial
  - El pago es inmediato, no genera redirección a MercadoPago`,
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
          in: 'path',
          required: true,
          schema: { type: 'integer', minimum: 1 },
          description: 'Número de cuota a pagar',
        },
      ],
      responses: {
        200: {
          description: 'Cuota pagada exitosamente con saldo de cuenta',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  { $ref: '#/components/schemas/SuccessResponse' },
                  {
                    type: 'object',
                    properties: {
                      data: { $ref: '#/components/schemas/PayWithBalanceResponse' },
                    },
                  },
                ],
              },
              example: {
                success: true,
                statusCode: 200,
                message: 'Cuota pagada exitosamente con saldo de cuenta',
                data: {
                  loan_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
                  payment_id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
                  payment_type: 'installment',
                  payment_method: 'account_balance',
                  installment_number: 3,
                  amount_paid: 50383.33,
                  loan_status: 'active',
                },
              },
            },
          },
        },
        400: {
          description: 'Saldo insuficiente, cuenta inactiva, préstamo no activo, cuota no pendiente o ya pagada',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              examples: {
                insufficientBalance: {
                  summary: 'Saldo insuficiente',
                  value: { success: false, statusCode: 400, message: 'Saldo insuficiente para realizar este pago', errorCode: 'BAD_REQUEST' },
                },
                accountNotActive: {
                  summary: 'Cuenta inactiva',
                  value: { success: false, statusCode: 400, message: 'Tu cuenta no está activa', errorCode: 'BAD_REQUEST' },
                },
                notActive: {
                  summary: 'Préstamo no activo',
                  value: { success: false, statusCode: 400, message: 'Este préstamo no está activo', errorCode: 'BAD_REQUEST' },
                },
                notPending: {
                  summary: 'Cuota no pendiente',
                  value: { success: false, statusCode: 400, message: 'Esta cuota no está pendiente de pago', errorCode: 'BAD_REQUEST' },
                },
                alreadyPaid: {
                  summary: 'Cuota ya pagada',
                  value: { success: false, statusCode: 400, message: 'Esta cuota ya fue pagada', errorCode: 'BAD_REQUEST' },
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
};

module.exports = loanClientPaths;