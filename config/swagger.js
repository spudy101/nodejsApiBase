const swaggerUi = require('swagger-ui-express');
const getAllSchemas = require('./swagger/schemas');
const getAllPaths = require('./swagger/paths');

const swaggerDocs = (app) => {
  const API_PREFIX = process.env.API_PREFIX || '/api/v1';
  const PORT = process.env.PORT || 3000;

  const swaggerSpec = {
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
        url: `http://localhost:${PORT}${API_PREFIX}`,
        description: 'Servidor de desarrollo'
      },
      {
        url: `https://tu-dominio.com${API_PREFIX}`,
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
      schemas: getAllSchemas() // ✨ Schemas modularizados
    },
    paths: getAllPaths(), // ✨ Paths modularizados
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
  };

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

  console.log(`📚 Documentación disponible en: http://localhost:${PORT}${API_PREFIX}/docs`);
};

module.exports = swaggerDocs;