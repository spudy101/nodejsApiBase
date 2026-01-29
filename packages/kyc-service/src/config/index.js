// packages/kyc-service/src/config/index.js

/**
 * KYC Service Configuration
 * Variables de entorno específicas para el servicio de KYC
 */

const {
  parseIntEnv,
  parseBoolEnv,
  getRequiredEnv,
  getOptionalEnv,
  validateConfig
} = require('@abundbank/shared');

/**
 * Validar configuración específica de KYC
 */
const validateKycConfig = () => {
  const errors = [];
  const warnings = [];

  // Validar Node Environment
  const nodeEnv = process.env.NODE_ENV;
  if (!['development', 'production', 'test'].includes(nodeEnv)) {
    warnings.push(`NODE_ENV="${nodeEnv}" no es estándar (development/production/test)`);
  }

  // Validar Database
  const requiredDbVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_DIALECT'];
  requiredDbVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Variable de BD requerida: ${varName}`);
    }
  });

  // Validar Encryption Keys
  if (!process.env.AES_KEY) {
    errors.push('AES_KEY es requerido para encriptación');
  }
  if (!process.env.AES_IV) {
    errors.push('AES_IV es requerido para encriptación');
  }

  // Validar CORS en producción
  if (nodeEnv === 'production' && process.env.CORS_ORIGIN === '*') {
    warnings.push('⚠️  CORS_ORIGIN="*" en producción es inseguro');
  }

  // Validar AWS (REQUERIDO)
  const awsVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'BUCKET_NAME'];
  awsVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Variable AWS requerida: ${varName}`);
    }
  });

  // Validar Cognito (REQUERIDO)
  if (!process.env.COGNITO_USER_POOL_ID) {
    errors.push('COGNITO_USER_POOL_ID es requerido');
  }
  if (!process.env.COGNITO_CLIENT_ID) {
    errors.push('COGNITO_CLIENT_ID es requerido');
  }

  // Validar ZapSign (REQUERIDO)
  const requiredZapSignVars = [
    'ZAPSIGN_API_KEY',
    'ZAPSIGN_TEMPLATE_ID',
    'ZAPSIGN_BASE_URL',
    'ZAPSIGN_REDIRECT_URL_MOVIL',
    'ZAPSIGN_REDIRECT_URL_WEB'
  ];
  
  requiredZapSignVars.forEach(varName => {
    if (!process.env[varName]) {
      errors.push(`Variable ZapSign requerida: ${varName}`);
    }
  });

  // Validar Frontend URL
  if (!process.env.FRONTEND_RESET_URL) {
    errors.push('FRONTEND_RESET_URL es requerido');
  }

  return { errors, warnings };
};

/**
 * Cargar y validar configuración
 */
const loadConfig = () => {
  const { errors, warnings } = validateKycConfig();

  // Validar y mostrar errores/warnings
  validateConfig(errors, warnings, 'KYC Service');

  return {
    // ==============================================
    // SERVER
    // ==============================================
    server: {
      nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
      port: parseIntEnv(process.env.PORT, 4001),
      host: getOptionalEnv('HOST', 'localhost'),
      corsOrigin: getOptionalEnv('CORS_ORIGIN', '*')
    },

    // ==============================================
    // DATABASE
    // ==============================================
    database: {
      host: getRequiredEnv('DB_HOST'),
      port: parseIntEnv(process.env.DB_PORT, 5432),
      name: getRequiredEnv('DB_NAME'),
      user: getRequiredEnv('DB_USER'),
      password: getRequiredEnv('DB_PASSWORD'),
      dialect: getRequiredEnv('DB_DIALECT'),
      schema: getOptionalEnv('DB_SCHEMA', 'public'),
      logging: parseBoolEnv(process.env.DB_LOGGING, false)
    },

    // ==============================================
    // REDIS
    // ==============================================
    redis: {
      enabled: !!process.env.REDIS_HOST || !!process.env.REDIS_URL,
      url: getOptionalEnv('REDIS_URL', ''),
      host: getOptionalEnv('REDIS_HOST', 'localhost'),
      port: parseIntEnv(process.env.REDIS_PORT, 6379),
      password: getOptionalEnv('REDIS_PASSWORD', ''),
      db: parseIntEnv(process.env.REDIS_DB, 0)
    },

    // ==============================================
    // ENCRYPTION
    // ==============================================
    encryption: {
      aesKey: getRequiredEnv('AES_KEY'),
      aesIv: getRequiredEnv('AES_IV'),
      algorithm: getOptionalEnv('ENCRYPTION_ALGORITHM', 'aes-256-cbc')
    },

    // ==============================================
    // SECURITY - Rate Limiting
    // ==============================================
    rateLimit: {
      windowMs: parseIntEnv(process.env.RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
      maxRequests: parseIntEnv(process.env.RATE_LIMIT_MAX_REQUESTS, 100),
      authWindowMs: parseIntEnv(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 15 * 60 * 1000),
      authMaxRequests: parseIntEnv(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS, 10)
    },

    // ==============================================
    // AWS
    // ==============================================
    aws: {
      region: getRequiredEnv('AWS_REGION'),
      accessKeyId: getRequiredEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredEnv('AWS_SECRET_ACCESS_KEY'),
      s3BucketName: getRequiredEnv('BUCKET_NAME')
    },

    // ==============================================
    // COGNITO
    // ==============================================
    cognito: {
      userPoolId: getRequiredEnv('COGNITO_USER_POOL_ID'),
      clientId: getRequiredEnv('COGNITO_CLIENT_ID')
    },

    // ==============================================
    // ZAPSIGN
    // ==============================================
    zapsign: {
      apiKey: getRequiredEnv('ZAPSIGN_API_KEY'),
      templateId: getRequiredEnv('ZAPSIGN_TEMPLATE_ID'),
      baseUrl: getRequiredEnv('ZAPSIGN_BASE_URL'),
      redirectUrlMovil: getRequiredEnv('ZAPSIGN_REDIRECT_URL_MOVIL'),
      redirectUrlWeb: getRequiredEnv('ZAPSIGN_REDIRECT_URL_WEB'),
      validationTimeoutMinutes: parseIntEnv(process.env.ZAPSIGN_VALIDATION_TIMEOUT_MINUTES, 60)
    },

    // ==============================================
    // FRONTEND URLs
    // ==============================================
    frontend: {
      resetCredentialUrl: getRequiredEnv('FRONTEND_RESET_URL')
    },

    // ==============================================
    // WORKERS
    // ==============================================
    workers: {
      enabled: parseBoolEnv(process.env.ENABLE_WORKERS, true)
    },

    // ==============================================
    // LOGGING
    // ==============================================
    logging: {
      level: getOptionalEnv('LOG_LEVEL', 'info')
    }
  };
};

// Exportar configuración
let config;

try {
  config = loadConfig();
} catch (error) {
  console.error('❌ Error cargando configuración de KYC Service');
  process.exit(1);
}

module.exports = config;