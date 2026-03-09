const productAuditLogPaths = {
  '/admin/api/loan/audit/products/{productId}': {
    get: {
      tags: ['Product Audit Log - Admin'],
      summary: 'Historial de auditoría del producto',
      security: [{BearerAuth: []}],
      parameters: [
        {name: 'productId', in: 'path', required: true, schema: {$ref: '#/components/schemas/UUID'}},
        {name: 'page', in: 'query', schema: {type: 'integer'}},
        {name: 'limit', in: 'query', schema: {type: 'integer'}}
      ],
      responses: {
        200: {$ref: '#/components/responses/PaginatedSuccess'},
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        404: {$ref: '#/components/responses/NotFound'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },
  '/admin/api/loan/audit/products/{productId}/stats': {
    get: {
      tags: ['Product Audit Log - Admin'],
      summary: 'Estadísticas de auditoría',
      security: [{BearerAuth: []}],
      parameters: [{name: 'productId', in: 'path', required: true, schema: {$ref: '#/components/schemas/UUID'}}],
      responses: {
        200: {
          description: 'Estadísticas obtenidas',
          content: {'application/json': {schema: {$ref: '#/components/schemas/ProductAuditLogStatsResponse'}}}
        },
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        404: {$ref: '#/components/responses/NotFound'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },
  '/admin/api/loan/audit/products/{productId}/action/{actionType}': {
    get: {
      tags: ['Product Audit Log - Admin'],
      summary: 'Historial por tipo de acción',
      security: [{BearerAuth: []}],
      parameters: [
        {name: 'productId', in: 'path', required: true, schema: {$ref: '#/components/schemas/UUID'}},
        {name: 'actionType', in: 'path', required: true, schema: {type: 'string', enum: ['created', 'updated', 'activated', 'deactivated', 'version_increment']}},
        {name: 'page', in: 'query', schema: {type: 'integer'}},
        {name: 'limit', in: 'query', schema: {type: 'integer'}}
      ],
      responses: {
        200: {$ref: '#/components/responses/PaginatedSuccess'},
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        404: {$ref: '#/components/responses/NotFound'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },
  '/admin/api/loan/audit/products/{productId}/date-range': {
    get: {
      tags: ['Product Audit Log - Admin'],
      summary: 'Historial por rango de fechas',
      security: [{BearerAuth: []}],
      parameters: [
        {name: 'productId', in: 'path', required: true, schema: {$ref: '#/components/schemas/UUID'}},
        {name: 'startDate', in: 'query', required: true, schema: {type: 'string', format: 'date-time'}},
        {name: 'endDate', in: 'query', required: true, schema: {type: 'string', format: 'date-time'}},
        {name: 'page', in: 'query', schema: {type: 'integer'}},
        {name: 'limit', in: 'query', schema: {type: 'integer'}}
      ],
      responses: {
        200: {$ref: '#/components/responses/PaginatedSuccess'},
        400: {$ref: '#/components/responses/BadRequest'},
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        404: {$ref: '#/components/responses/NotFound'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },
  '/api/admin/audit/admin/{adminId}': {
    get: {
      tags: ['Product Audit Log - Admin'],
      summary: 'Historial de un administrador',
      security: [{BearerAuth: []}],
      parameters: [
        {name: 'adminId', in: 'path', required: true, schema: {$ref: '#/components/schemas/UUID'}},
        {name: 'page', in: 'query', schema: {type: 'integer'}},
        {name: 'limit', in: 'query', schema: {type: 'integer'}}
      ],
      responses: {
        200: {$ref: '#/components/responses/PaginatedSuccess'},
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  },
  '/api/admin/audit/{id}': {
    get: {
      tags: ['Product Audit Log - Admin'],
      summary: 'Detalle de log de auditoría',
      security: [{BearerAuth: []}],
      parameters: [{name: 'id', in: 'path', required: true, schema: {$ref: '#/components/schemas/UUID'}}],
      responses: {
        200: {$ref: '#/components/responses/Success'},
        401: {$ref: '#/components/responses/Unauthorized'},
        403: {$ref: '#/components/responses/Forbidden'},
        404: {$ref: '#/components/responses/NotFound'},
        500: {$ref: '#/components/responses/InternalServerError'}
      }
    }
  }
};
module.exports = productAuditLogPaths;