// config/swagger.admin.js
const swaggerUi = require('swagger-ui-express');
const getAllSchemas = require('./swagger/schemas');
const commonResponses = require('./swagger/responses/common.responses');
const commonParameters = require('./swagger/parameters/common.parameters');
const { server } = require('../shared/constants');

// Importar paths
const kycPersonAdminPaths = require('./swagger/paths/kycPersonAdmin.paths');
const notificationTypeAdminPaths = require('./swagger/paths/notificationTypeAdmin.paths');

const authSharedPaths = require('./swagger/paths/authShared.paths');
const coreMaintainersSharedPaths = require('./swagger/paths/coreMaintainersShared.paths');
const kycMFASharedPaths = require('./swagger/paths/kycMFAShared.paths');
const kycNotificationPreferenceSharedPaths = require('./swagger/paths/kycNotificationPreferenceShared.paths');
const kycProfileSharedPaths = require('./swagger/paths/kycProfileShared.paths');
const kycSocialNetworkSharedPaths = require('./swagger/paths/kycSocialNetworkShared.paths');
const notificationSharedPaths = require('./swagger/paths/notificationShared.paths');

/**
 * Configuración de Swagger para el módulo ADMIN
 * Incluye rutas específicas de admin + rutas compartidas
 */
const swaggerAdminDocs = (app) => {
  const PORT = server.port;
  const NODE_ENV = server.nodeEnv;
  const HOST = server.host;
  
  // Determinar servidor según entorno
  const servers = [];
  
  if (NODE_ENV === 'development') {
    servers.push({
      url: `http://${HOST}:${PORT}/admin`,
      description: 'Servidor de desarrollo - Admin API'
    });
  } else if (NODE_ENV === 'production') {
    servers.push({
      url: `https://democracialiquida.com/admin`,
      description: 'Servidor de producción - Admin API'
    });
  }

  // Especificación OpenAPI para ADMIN
  const swaggerSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Democracia Líquida - Admin API',
      version: '1.0.0',
      description: `
## Documentación de la API de Administración

Esta API permite a los administradores:
- 🔐 Autenticarse con permisos de admin
- 📋 Gestionar tipos de notificaciones
- 👥 Gestionar personas (KYC de usuarios)
- 🔔 Configurar notificaciones del sistema
- 👤 Gestionar perfiles de usuarios
- 🔒 Gestionar MFA de usuarios

### Rutas Incluidas:
- **Específicas de Admin:** Tipos de notificaciones, Gestión de personas
- **Compartidas:** Auth, KYC, Notificaciones, Core Maintainers

⚠️ **Nota:** Todos los endpoints requieren autenticación con rol de administrador.
      `,
      contact: {
        name: 'Democracia Líquida - Soporte Admin',
        email: 'admin@democracialiquida.com'
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
          description: 'Ingresa tu token JWT de administrador. Formato: Bearer {token}'
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
    // Seguridad global: todos los endpoints requieren autenticación
    security: [
      {
        bearerAuth: []
      }
    ],
    paths: {
      // ==========================================
      // RUTAS ESPECÍFICAS DE ADMIN
      // ==========================================
      ...kycPersonAdminPaths,
      ...notificationTypeAdminPaths,
      
      // ==========================================
      // RUTAS COMPARTIDAS (usadas por admin)
      // ==========================================
      ...authSharedPaths,
      ...coreMaintainersSharedPaths,
      ...kycMFASharedPaths,
      ...kycNotificationPreferenceSharedPaths,
      ...kycProfileSharedPaths,
      ...kycSocialNetworkSharedPaths, 
      ...notificationSharedPaths,

    },
    tags: [
      {
        name: 'Auth - Shared',
        description: '🔑 Autenticación (login, logout, refresh token)'
      },
      {
        name: 'Notification Types - Admin',
        description: '📋 Gestión de tipos de notificaciones del sistema'
      },
      {
        name: 'KYC Person - Admin',
        description: '👥 Gestión administrativa de personas (KYC)'
      },
      {
        name: 'KYC Profile - Shared',
        description: '👤 Gestión de perfiles de usuarios'
      },
      {
        name: 'KYC MFA - Shared',
        description: '🔒 Gestión de autenticación de dos factores'
      },
      {
        name: 'KYC Social Networks - Shared',
        description: '📱 Gestión de redes sociales vinculadas'
      },
      {
        name: 'KYC Notification Preferences - shared',
        description: '🔔 Configuración de preferencias de notificaciones'
      },
      {
        name: 'Notifications - Shared',
        description: '📬 Gestión de notificaciones'
      },
      {
        name: 'Core Maintainers - Shared',
        description: '🌍 Datos maestros (países, ciudades, géneros, etc.)'
      }
    ]
  };

  // ⚠️ SOLUCIÓN AL CONFLICTO: Usar generateHTML para cada request
  app.get('/docs', (req, res, next) => {
    // Forzar regeneración del HTML en cada request
    const html = swaggerUi.generateHTML(swaggerSpec, {
      explorer: true,
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0; }
        .swagger-ui .scheme-container { margin: 20px 0; }
        .swagger-ui .info .title { color: #d32f2f; }
      `,
      customSiteTitle: 'Admin API - Democracia Líquida',
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

  // JSON spec para /admin/docs.json
  app.get('/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  console.log(`📚 [ADMIN] Swagger Docs: http://${HOST}:${PORT}/admin/docs`);
};

module.exports = swaggerAdminDocs;