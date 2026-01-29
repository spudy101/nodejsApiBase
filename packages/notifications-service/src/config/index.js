// packages/notifications-service/src/config/index.js

/**
 * Notifications Service Configuration
 * Variables de entorno específicas para el servicio de notificaciones
 */

const {
  parseIntEnv,
  parseBoolEnv,
  getRequiredEnv,
  getOptionalEnv,
  validateConfig
} = require('@abundbank/shared');

/**
 * Validar configuración específica de Notifications
 */
const validateNotificationsConfig = () => {
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

  // Validar SES (Email) - Warnings si no están
  if (!process.env.SES_FROM_EMAIL) {
    warnings.push('SES_FROM_EMAIL no configurado - Email notifications deshabilitadas');
  }

  // Validar SNS (Push) - Warnings si no están
  if (!process.env.SNS_PLATFORM_ARN_IOS && !process.env.SNS_PLATFORM_ARN_ANDROID) {
    warnings.push('SNS Platform ARNs no configurados - Push notifications deshabilitadas');
  }

  return { errors, warnings };
};

/**
 * Cargar y validar configuración
 */
const loadConfig = () => {
  const { errors, warnings } = validateNotificationsConfig();

  // Validar y mostrar errores/warnings
  validateConfig(errors, warnings, 'Notifications Service');

  return {
    // ==============================================
    // SERVER
    // ==============================================
    server: {
      nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
      port: parseIntEnv(process.env.PORT, 4002),
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
      maxRequests: parseIntEnv(process.env.RATE_LIMIT_MAX_REQUESTS, 100)
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
    // SES (Email Service)
    // ==============================================
    ses: {
      enabled: !!process.env.SES_FROM_EMAIL,
      fromEmail: getOptionalEnv('SES_FROM_EMAIL', ''),
      logoUrl: getOptionalEnv('LOGO_URL', '')
    },

    // ==============================================
    // SNS (Push Notifications)
    // ==============================================
    sns: {
      enabled: !!(process.env.SNS_PLATFORM_ARN_IOS || process.env.SNS_PLATFORM_ARN_ANDROID),
      platformArnIos: getOptionalEnv('SNS_PLATFORM_ARN_IOS', ''),
      platformArnAndroid: getOptionalEnv('SNS_PLATFORM_ARN_ANDROID', '')
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
  console.error('❌ Error cargando configuración de Notifications Service');
  process.exit(1);
}

module.exports = config;