// config/swagger.client.js
const swaggerUi = require('swagger-ui-express');
const getAllSchemas = require('./swagger/schemas');
const commonResponses = require('./swagger/responses/common.responses');
const commonParameters = require('./swagger/parameters/common.parameters');

// Importar paths
const authClientPaths = require('./swagger/paths/authClient.paths');
const verificationClientPaths = require('./swagger/paths/verificationClient.paths');

const authSharedPaths = require('./swagger/paths/authShared.paths');
const coreMaintainersSharedPaths = require('./swagger/paths/coreMaintainersShared.paths');

/**
 * Configuración de Swagger para el módulo CLIENT
 * Incluye rutas específicas de client + rutas compartidas
 */
const swaggerClientDocs = (app) => {
  const PORT = process.env.PORT || 3000;
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const HOST = process.env.HOST || 'localhost';
  
  // Determinar servidor según entorno
  const servers = [];
  
  if (NODE_ENV === 'development') {
    servers.push({
      url: `http://${HOST}:${PORT}/client`,
      description: 'Servidor de desarrollo - Client API'
    });
  } else if (NODE_ENV === 'production') {
    servers.push({
      url: `https://democracialiquida.com/client`,
      description: 'Servidor de producción - Client API'
    });
  }

  // Especificación OpenAPI para CLIENT
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Democracia Líquida - Client API',
      version: '1.0.0',
      description: `
## Documentación de la API de Clientes

Esta API permite a los usuarios:
- 🔐 Registrarse y autenticarse
- 👤 Gestionar su perfil (KYC)
- 🔔 Configurar notificaciones
- 🔒 Gestionar MFA (autenticación de dos factores)
- 📱 Gestionar redes sociales vinculadas
- ✉️ Enviar códigos de verificación

### Rutas Incluidas:
- **Específicas de Client:** Registro, verificaciones
- **Compartidas:** Auth, KYC, Notificaciones, Core Maintainers
      `,
      contact: {
        name: 'Democracia Líquida - Soporte',
        email: 'soporte@democracialiquida.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: servers,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingresa tu token JWT. Formato: Bearer {token}'
        }
      },
      schemas: {
        ...getAllSchemas()
      },
      responses: {
        ...commonResponses
      },
      parameters: {
        ...commonParameters
      }
    },
    paths: {
      // ==========================================
      // RUTAS ESPECÍFICAS DE CLIENT
      // ==========================================
      ...authClientPaths,
      ...verificationClientPaths,
      
      // ==========================================
      // RUTAS COMPARTIDAS (usadas por client)
      // ==========================================
      ...authSharedPaths,
      ...coreMaintainersSharedPaths,

    },
    tags: [
      {
        name: 'Auth - Client',
        description: '🔐 Autenticación específica de clientes (registro, reset de credenciales)'
      },
      {
        name: 'Auth - Shared',
        description: '🔑 Autenticación compartida (login, logout, refresh token)'
      },
      {
        name: 'Verification - Client',
        description: '✉️ Envío de códigos de verificación'
      },
      {
        name: 'KYC - Profile',
        description: '👤 Gestión de perfil de usuario (datos personales, ubicación, contacto)'
      },
      {
        name: 'KYC - MFA',
        description: '🔒 Autenticación de dos factores (configuración, verificación)'
      },
      {
        name: 'KYC - Social Networks',
        description: '📱 Gestión de redes sociales vinculadas'
      },
      {
        name: 'KYC - Notification Preferences',
        description: '🔔 Configuración de preferencias de notificaciones'
      },
      {
        name: 'Notifications',
        description: '📬 Gestión de notificaciones del usuario'
      },
      {
        name: 'Core Maintainers - Shared',
        description: '🌍 Datos maestros (países, ciudades, géneros, etc.)'
      },
    ]
  };

  // ⚠️ SOLUCIÓN AL CONFLICTO: Crear setup function única para cada instancia
  const swaggerSetup = swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 20px 0; }
      .swagger-ui .scheme-container { margin: 20px 0; }
      .swagger-ui .info .title { color: #1976d2; }
    `,
    customSiteTitle: 'Client API - Democracia Líquida',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      docExpansion: 'list',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      syntaxHighlight: {
        activate: true,
        theme: 'monokai'
      }
    }
  });

  // ⚠️ IMPORTANTE: Usar generateHTML para evitar conflictos
  app.get('/docs', (req, res, next) => {
    // Forzar regeneración del HTML en cada request
    const html = swaggerUi.generateHTML(swaggerSpec, {
      explorer: true,
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .scheme-container { margin: 20px 0; }
        .swagger-ui .info .title { color: #1976d2; }
      `,
      customSiteTitle: 'Client API - Democracia Líquida',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: 'list',
        filter: true
      }
    });
    res.send(html);
  });

  // Servir assets de Swagger UI
  app.use('/docs', swaggerUi.serveFiles(swaggerSpec, {}));

  // JSON spec para /client/docs.json
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 [CLIENT] Swagger Docs: http://${HOST}:${PORT}/client/docs`);
};

module.exports = swaggerClientDocs;