// config/swagger.admin.js
const swaggerUi = require('swagger-ui-express');
const getAllSchemas = require('./swagger/schemas');
const commonResponses = require('./swagger/responses/common.responses');
const commonParameters = require('./swagger/parameters/common.parameters');
const { server } = require('../shared/constants');

// Importar paths
const personAdminPaths = require('./swagger/modules/admin/kyc/paths/person.paths');
const notificationTypeAdminPaths = require('./swagger/modules/admin/kyc/paths/notificationType.paths');
const changeLogAdminPaths = require('./swagger/modules/admin/kyc/paths/changeLog.paths');
const employmentRecordsAdminPaths = require('./swagger/modules/admin/kyc/paths/employmentRecords.paths');
const screeningAdminPaths = require('./swagger/modules/admin/kyc/paths/screening.paths');
const taxResidencyAdminPaths = require('./swagger/modules/admin/kyc/paths/taxResidency.paths');
const institutionalAdminPaths = require('./swagger/modules/admin/kyc/paths/institutional.paths');

const changerequestAdminPaths = require('./swagger/modules/admin/loan/paths/changerequest.paths');
const productLoantAdminPaths = require('./swagger/modules/admin/loan/paths/productLoan.paths');
const productauditlogAdminPaths = require('./swagger/modules/admin/loan/paths/productauditlog.paths');
const systemglobalconfigAdminPaths = require('./swagger/modules/admin/loan/paths/systemglobalconfig.paths');
const loanApplicationReviewAdminPaths = require('./swagger/modules/admin/loan/paths/loanApplicationReview.paths');
const contractsAdminPaths = require('./swagger/modules/admin/loan/paths/contracts.paths');
const loanAdminPaths = require('./swagger/modules/admin/loan/paths/loan.paths');

// Shared Schemas
const authSharedPaths = require('./swagger/shared/kyc/paths/auth.paths');
const MFASharedPaths = require('./swagger/shared/kyc/paths/MFA.paths');
const notificationPreferenceSharedPaths = require('./swagger/shared/kyc/paths/notificationPreference.paths');
const profileSharedPaths = require('./swagger/shared/kyc/paths/profile.paths');

const maintainersSharedPaths = require('./swagger/shared/common/paths/maintainers.paths');

const notificationSharedPaths = require('./swagger/shared/notifications/paths/notification.paths');

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
      ...personAdminPaths,
      ...notificationTypeAdminPaths,
      ...changeLogAdminPaths,
      ...employmentRecordsAdminPaths,
      ...screeningAdminPaths,
      ...taxResidencyAdminPaths,
      ...institutionalAdminPaths,

      ...changerequestAdminPaths,
      ...productLoantAdminPaths,
      ...productauditlogAdminPaths,
      ...systemglobalconfigAdminPaths,
      ...loanApplicationReviewAdminPaths,
      ...contractsAdminPaths,
      ...loanAdminPaths,

      // ==========================================
      // RUTAS COMPARTIDAS (usadas por client)
      // ==========================================
      ...authSharedPaths,
      ...maintainersSharedPaths,
      ...MFASharedPaths,
      ...notificationPreferenceSharedPaths,
      ...profileSharedPaths,
      ...notificationSharedPaths,

    },
    tags: [
      {
        name: 'Notification Types - Admin',
        description: '📋 Gestión de tipos de notificaciones del sistema'
      },
      {
        name: 'KYC Person - Admin',
        description: '👥 Gestión administrativa de personas (KYC)'
      },
      {
        name: 'Change Logs - Admin',
        description: '📋 Vista de cambios realizados a publicaciones y usuarios'
      },
      {
        name: 'Documentos laborales - Admin',
        description: '📋 Gestion de documentos laborales'
      },
      {
        name: 'Screening - Admin',
        description: '📋 Gestion de Screening'
      },
      {
        name: 'Tax Residency - Admin',
        description: '📋 Gestion de Tax Residency'
      },
      {
        name: 'Instituciones - Admin',
        description: '📋 Gestion de intituciones'
      },

      {
        name: 'Auth - Shared',
        description: '🔑 Autenticación (login, logout, refresh token)'
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