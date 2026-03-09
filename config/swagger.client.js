// config/swagger.client.js
const swaggerUi = require('swagger-ui-express');
const getAllSchemas = require('./swagger/schemas');
const commonResponses = require('./swagger/responses/common.responses');
const commonParameters = require('./swagger/parameters/common.parameters');
const { server } = require('../shared/constants');

// Importar paths
const authClientPaths = require('./swagger/modules/client/kyc/paths/auth.paths');
const sendVerificationClientPaths = require('./swagger/modules/client/kyc/paths/sendVerification.paths');
const zapSignClientPaths = require('./swagger/modules/client/kyc/paths/zapSign.paths');
const profileCompletenessClientPaths = require('./swagger/modules/client/kyc/paths/profileCompleteness.paths');
const employmentRecordsClientPaths = require('./swagger/modules/client/kyc/paths/employmentRecords.paths');
const screeningClientPaths = require('./swagger/modules/client/kyc/paths/screening.paths');
const taxResidencyClientPaths = require('./swagger/modules/client/kyc/paths/taxResidency.paths');
const cosignerClientPaths = require('./swagger/modules/client/kyc/paths/cosigner.paths');
const institutionalClientPaths = require('./swagger/modules/client/kyc/paths/institutional.paths');

const productLoanClientPaths = require('./swagger/modules/client/loan/paths/productLoan.paths');
const loanApplicationReviewClientPaths = require('./swagger/modules/client/loan/paths/loanApplicationReview.paths');
const loanOfferClientPaths = require('./swagger/modules/client/loan/paths/loanOffer.paths');
const contractsClientPaths = require('./swagger/modules/client/loan/paths/contracts.paths');
const loanClientPaths = require('./swagger/modules/client/loan/paths/loan.paths');

// Shared Schemas
const authSharedPaths = require('./swagger/shared/kyc/paths/auth.paths');
const MFASharedPaths = require('./swagger/shared/kyc/paths/MFA.paths');
const notificationPreferenceSharedPaths = require('./swagger/shared/kyc/paths/notificationPreference.paths');
const profileSharedPaths = require('./swagger/shared/kyc/paths/profile.paths');

const maintainersSharedPaths = require('./swagger/shared/common/paths/maintainers.paths');

const notificationSharedPaths = require('./swagger/shared/notifications/paths/notification.paths');

/**
 * Configuración de Swagger para el módulo CLIENT
 * Incluye rutas específicas de client + rutas compartidas
 */
const swaggerClientDocs = (app) => {
  const PORT = server.port;
  const NODE_ENV = server.nodeEnv;
  const HOST = server.host;
  
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
      ...sendVerificationClientPaths,
      ...zapSignClientPaths,
      ...profileCompletenessClientPaths,
      ...employmentRecordsClientPaths,
      ...taxResidencyClientPaths,
      ...institutionalClientPaths,
      ...cosignerClientPaths,
      ...screeningClientPaths,

      ...productLoanClientPaths,
      ...loanApplicationReviewClientPaths,
      ...loanOfferClientPaths,
      ...contractsClientPaths,
      ...loanClientPaths,
      
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
        name: 'Zapsing - Client',
        description: 'validacion biometrica especifica para los clientes'
      },
      {
        name: 'Auth - Client',
        description: '🔐 Autenticación específica de clientes (registro, reset de credenciales)'
      },
      {
        name: 'Verification - Client',
        description: '✉️ Envío de códigos de verificación'
      },
      {
        name: 'KYC Profile - Client',
        description: '👤 Gestión de perfil de usuario (KYC) específico para clientes'
      },
      {
        name: 'Documentos laborales - Client',
        description: '📋 Gestion de documentos laborales'
      },
      {
        name: 'Screening - Client',
        description: '📋 Gestion de Screening'
      },
      {
        name: 'Tax Residency - Client',
        description: '📋 Gestion de Tax Residency'
      },
      {
        name: 'Cosigner Invitations',
        description: '🔑 Generar codigos de invitacion y gestionarlos'
      },
      {
        name: 'Debtor-Cosigner Relationships',
        description: '📋 Gestion de mis codeudores guardados'
      },
      {
        name: 'Correos Institucionales - Client',
        description: '📋 Gestion de mis correos intitucionales'
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