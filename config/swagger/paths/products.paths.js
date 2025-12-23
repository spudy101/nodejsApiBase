/**
 * Paths de productos
 */

const productPaths = {
  '/products': {
    get: {
      tags: ['Products'],
      summary: 'Listar productos con paginación',
      parameters: [
        {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            default: 1,
            minimum: 1
          },
          description: 'Número de página'
        },
        {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            default: 10,
            minimum: 1,
            maximum: 100
          },
          description: 'Cantidad de resultados por página'
        },
        {
          in: 'query',
          name: 'category',
          schema: {
            type: 'string'
          },
          description: 'Filtrar por categoría'
        },
        {
          in: 'query',
          name: 'search',
          schema: {
            type: 'string'
          },
          description: 'Buscar por nombre o descripción'
        }
      ],
      responses: {
        200: {
          description: 'Lista de productos',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/PaginatedResponse'
              }
            }
          }
        }
      }
    },
    post: {
      tags: ['Products'],
      summary: 'Crear nuevo producto',
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
              $ref: '#/components/schemas/ProductCreate'
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
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string',
                    example: 'Producto creado exitosamente'
                  },
                  data: {
                    $ref: '#/components/schemas/Product'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse'
              }
            }
          }
        },
        401: {
          description: 'No autorizado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  },
  '/products/{id}': {
    get: {
      tags: ['Products'],
      summary: 'Obtener producto por ID',
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'ID del producto'
        }
      ],
      responses: {
        200: {
          description: 'Producto encontrado',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string'
                  },
                  data: {
                    $ref: '#/components/schemas/Product'
                  }
                }
              }
            }
          }
        },
        404: {
          description: 'Producto no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    put: {
      tags: ['Products'],
      summary: 'Actualizar producto',
      security: [
        {
          bearerAuth: []
        }
      ],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ProductUpdate'
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Producto actualizado exitosamente',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: true
                  },
                  message: {
                    type: 'string'
                  },
                  data: {
                    $ref: '#/components/schemas/Product'
                  }
                }
              }
            }
          }
        },
        400: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ValidationErrorResponse'
              }
            }
          }
        },
        401: {
          description: 'No autorizado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        404: {
          description: 'Producto no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    },
    delete: {
      tags: ['Products'],
      summary: 'Eliminar producto',
      security: [
        {
          bearerAuth: []
        }
      ],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: {
            type: 'string',
            format: 'uuid'
          }
        }
      ],
      responses: {
        200: {
          description: 'Producto eliminado exitosamente',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/SuccessResponse'
              }
            }
          }
        },
        401: {
          description: 'No autorizado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        },
        404: {
          description: 'Producto no encontrado',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              }
            }
          }
        }
      }
    }
  }
};

module.exports = productPaths;