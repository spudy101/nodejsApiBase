/**
 * Product Loan Swagger Paths - REFACTORIZADO
 * Documentación de endpoints para productos de préstamo
 * 
 * INCLUYE: Rutas de aprobación/rechazo de cambios (movidas desde ChangeRequestService)
 */

const productLoanPaths = {

  // ==================== ENDPOINTS ADMIN ====================

  '/admin/api/loan/products': {
    get: {
      tags: ['Product Loan - Admin'],
      summary: 'Lista todos los productos (admin)',
      description: 'Obtiene lista completa de productos con toda la configuración (incluye params_client_configuration)',
      operationId: 'listAllProductsAdmin',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          }
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          }
        },
        {
          name: 'isActive',
          in: 'query',
          description: 'Filtrar por estado activo/inactivo',
          required: false,
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'sortBy',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['created_at', 'updated_at', 'product_name', 'product_code', 'version']
          }
        },
        {
          name: 'order',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['ASC', 'DESC']
          }
        }
      ],
      responses: {
        200: {
          description: 'Productos obtenidos exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ProductLoanAdminListResponse'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        403: {
          $ref: '#/components/responses/Forbidden'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    },

    post: {
      tags: ['Product Loan - Admin'],
      summary: 'Crea un nuevo producto',
      description: 'Crea un nuevo producto de préstamo (sin aprobación requerida)',
      operationId: 'createProduct',
      security: [
        {
          BearerAuth: []
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/CreateProductLoanRequest'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Producto creado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ProductLoanAdminResponse'
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
          $ref: '#/components/responses/Forbidden'
        },
        409: {
          $ref: '#/components/responses/Conflict'
        },
        422: {
          $ref: '#/components/responses/ValidationError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  '/admin/api/loan/products/stats': {
    get: {
      tags: ['Product Loan - Admin'],
      summary: 'Obtiene estadísticas de productos',
      description: 'Obtiene estadísticas generales de productos (total, activos, inactivos)',
      operationId: 'getProductStats',
      security: [
        {
          BearerAuth: []
        }
      ],
      responses: {
        200: {
          description: 'Estadísticas obtenidas exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ProductStatsResponse'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        403: {
          $ref: '#/components/responses/Forbidden'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  '/admin/api/loan/products/{id}': {
    get: {
      tags: ['Product Loan - Admin'],
      summary: 'Obtiene detalle completo de un producto (admin)',
      description: 'Obtiene toda la información de un producto incluyendo configuración interna',
      operationId: 'getProductDetailAdmin',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'ID del producto',
          required: true,
          schema: {
            $ref: '#/components/schemas/UUID'
          }
        }
      ],
      responses: {
        200: {
          description: 'Producto obtenido exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ProductLoanAdminResponse'
              }
            }
          }
        },
        401: {
          $ref: '#/components/responses/Unauthorized'
        },
        403: {
          $ref: '#/components/responses/Forbidden'
        },
        404: {
          $ref: '#/components/responses/NotFound'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  '/admin/api/loan/products/{id}/request-change': {
    post: {
      tags: ['Product Loan - Admin'],
      summary: 'Solicita cambio en un producto',
      description: 'Crea una solicitud de cambio que requiere aprobación de otro administrador',
      operationId: 'requestProductChange',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'id',
          in: 'path',
          description: 'ID del producto',
          required: true,
          schema: {
            $ref: '#/components/schemas/UUID'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RequestProductChangeRequest'
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Solicitud de cambio creada exitosamente',
          content: {
            'application/json': {
              schema: {
                allOf: [
                  {
                    $ref: '#/components/schemas/SuccessResponse'
                  },
                  {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        description: 'Detalles de la solicitud de cambio creada'
                      }
                    }
                  }
                ]
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
          $ref: '#/components/responses/Forbidden'
        },
        404: {
          $ref: '#/components/responses/NotFound'
        },
        409: {
          $ref: '#/components/responses/Conflict'
        },
        422: {
          $ref: '#/components/responses/ValidationError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  // ==================== APROBACIÓN/RECHAZO DE CAMBIOS (SEGUNDO ADMIN) ====================

  '/admin/api/loan/products/change-requests/{changeRequestId}/approve': {
    post: {
      tags: ['Product Loan - Admin'],
      summary: 'Aprueba solicitud de cambio de producto (segundo admin)',
      description: 'Aprueba una solicitud de cambio y aplica los cambios al producto. Requiere ser un administrador diferente al solicitante. Incrementa la versión del producto y crea audit log.',
      operationId: 'approveProductChangeRequest',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'changeRequestId',
          in: 'path',
          description: 'ID de la solicitud de cambio',
          required: true,
          schema: {
            $ref: '#/components/schemas/UUID'
          }
        }
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApproveProductChangeRequestBody'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Solicitud aprobada y cambios aplicados exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ApproveProductChangeResponse'
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
          description: 'Forbidden - No puedes aprobar tus propios cambios',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        404: {
          $ref: '#/components/responses/NotFound'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  },

  '/admin/api/loan/products/change-requests/{changeRequestId}/reject': {
    post: {
      tags: ['Product Loan - Admin'],
      summary: 'Rechaza solicitud de cambio de producto (segundo admin)',
      description: 'Rechaza una solicitud de cambio sin aplicar cambios. Requiere ser un administrador diferente al solicitante y proporcionar notas de rechazo (mínimo 10 caracteres).',
      operationId: 'rejectProductChangeRequest',
      security: [
        {
          BearerAuth: []
        }
      ],
      parameters: [
        {
          name: 'changeRequestId',
          in: 'path',
          description: 'ID de la solicitud de cambio',
          required: true,
          schema: {
            $ref: '#/components/schemas/UUID'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/RejectProductChangeRequestBody'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Solicitud rechazada exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RejectProductChangeResponse'
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
          description: 'Forbidden - No puedes rechazar tus propios cambios',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        404: {
          $ref: '#/components/responses/NotFound'
        },
        422: {
          $ref: '#/components/responses/ValidationError'
        },
        500: {
          $ref: '#/components/responses/InternalServerError'
        }
      }
    }
  }
};

module.exports = productLoanPaths;