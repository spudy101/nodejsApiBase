const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Node.js + Express + PostgreSQL',
      version: '1.0.0',
      description: 'API RESTful con autenticación JWT, CRUD completo y buenas prácticas',
      contact: {
        name: 'Tu Nombre',
        email: 'tu@email.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}${process.env.API_PREFIX || '/api/v1'}`,
        description: 'Servidor de desarrollo'
      },
      {
        url: `https://tu-dominio.com${process.env.API_PREFIX || '/api/v1'}`,
        description: 'Servidor de producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT en el formato: Bearer {token}'
        }
      },
      schemas: {
        // Schemas de respuesta
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operación exitosa'
            },
            data: {
              type: 'object'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-18T20:00:00.000Z'
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error en la operación'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2025-12-18T20:00:00.000Z'
            }
          }
        },
        ValidationErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Errores de validación'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    example: 'email'
                  },
                  message: {
                    type: 'string',
                    example: 'El email es requerido'
                  }
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        PaginatedResponse: {
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
              type: 'array',
              items: {
                type: 'object'
              }
            },
            pagination: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1
                },
                limit: {
                  type: 'integer',
                  example: 10
                },
                total: {
                  type: 'integer',
                  example: 100
                },
                totalPages: {
                  type: 'integer',
                  example: 10
                },
                hasNextPage: {
                  type: 'boolean',
                  example: true
                },
                hasPrevPage: {
                  type: 'boolean',
                  example: false
                }
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        // Schemas de modelos
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: '123e4567-e89b-12d3-a456-426614174000'
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'usuario@example.com'
            },
            name: {
              type: 'string',
              example: 'Juan Pérez'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              example: 'user'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              nullable: true
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        },
        Product: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid'
            },
            name: {
              type: 'string',
              example: 'Laptop HP'
            },
            description: {
              type: 'string',
              example: 'Laptop HP Pavilion 15.6"'
            },
            price: {
              type: 'number',
              format: 'decimal',
              example: 799.99
            },
            stock: {
              type: 'integer',
              example: 15
            },
            category: {
              type: 'string',
              example: 'Electronics'
            },
            isActive: {
              type: 'boolean',
              example: true
            },
            createdBy: {
              type: 'string',
              format: 'uuid'
            },
            creator: {
              $ref: '#/components/schemas/User'
            },
            createdAt: {
              type: 'string',
              format: 'date-time'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time'
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Endpoints de autenticación y gestión de perfil'
      },
      {
        name: 'Users',
        description: 'Gestión de usuarios (Solo Admin)'
      },
      {
        name: 'Products',
        description: 'Gestión de productos (CRUD completo)'
      }
    ]
  },
  apis: ['./src/routes/*.js'] // Archivos donde buscar anotaciones
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerDocs = (app) => {
  const API_PREFIX = process.env.API_PREFIX || '/api/v1';
  
  // Swagger UI
  app.use(
    `${API_PREFIX}/docs`,
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'API Documentation'
    })
  );

  // JSON spec
  app.get(`${API_PREFIX}/docs.json`, (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 Documentación disponible en: http://localhost:${process.env.PORT || 3000}${API_PREFIX}/docs`);
};

module.exports = swaggerDocs;