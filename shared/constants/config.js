// src/config/index.js

/**
 * Configuration module - SOLO VARIABLES DE ENTORNO
 * Valida variables críticas al inicio
 * Las constantes fijas están en src/constants/index.js
 */

class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

const parseIntEnv = (value, defaultValue) => {
  if (value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseBoolEnv = (value, defaultValue = false) => {
  if (value === undefined || value === '') return defaultValue;
  return value === 'true' || value === '1';
};

const getRequiredEnv = (key, errorMessage) => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new ConfigurationError(
      errorMessage || `Variable requerida faltante: ${key}`
    );
  }
  return value;
};

const getOptionalEnv = (key, defaultValue) => {
  const value = process.env[key];
  return (value && value.trim() !== '') ? value : defaultValue;
};

/**
 * Validación de configuración
 */
const validateConfig = () => {
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

  // Validar AWS (REQUERIDO - el proyecto se cae sin esto)
  const awsVars = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  const hasAllAws = awsVars.every(v => process.env[v]);
  
  if (!hasAllAws) {
    errors.push('Variables AWS requeridas: AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY');
  }

  // Validar Cognito (REQUERIDO - el proyecto se cae sin esto)
  if (!process.env.COGNITO_USER_POOL_ID) {
    errors.push('COGNITO_USER_POOL_ID es requerido');
  }
  if (!process.env.COGNITO_CLIENT_ID) {
    errors.push('COGNITO_CLIENT_ID es requerido');
  }

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
  const { errors, warnings } = validateConfig();

  // Mostrar warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  ADVERTENCIAS DE CONFIGURACIÓN:');
    warnings.forEach(warning => console.warn(`   ${warning}`));
    console.warn('');
  }

  // Errores críticos
  if (errors.length > 0) {
    console.error('\n❌ ERRORES DE CONFIGURACIÓN:');
    errors.forEach(error => console.error(`   • ${error}`));
    console.error('\n💡 Revisa tu .env y completa las variables requeridas.\n');
    throw new ConfigurationError(
      `Faltan ${errors.length} variable(s) requerida(s)`
    );
  }

  console.log('✅ Configuración validada correctamente\n');

  return {
    // ==============================================
    // SERVER
    // ==============================================
    server: {
      nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
      port: parseIntEnv(process.env.PORT, 4000),
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
    // REDIS (Opcional - fallback a caché local)
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
      algorithm: getOptionalEnv('ENCRYPTION_ALGORITHM', 'aes-256-cbc'),
      externalApiKeys: getOptionalEnv('EXTERNAL_API_KEYS', '')
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
    // AWS (REQUERIDO)
    // ==============================================
    aws: {
      region: getRequiredEnv('AWS_REGION'),
      accessKeyId: getRequiredEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredEnv('AWS_SECRET_ACCESS_KEY')
    },

    // ==============================================
    // COGNITO (REQUERIDO)
    // ==============================================
    cognito: {
      userPoolId: getRequiredEnv('COGNITO_USER_POOL_ID'),
      clientId: getRequiredEnv('COGNITO_CLIENT_ID')
    },

    // ==============================================
    // FRONTEND URLs
    // ==============================================
    frontend: {
      resetCredentialUrl: getRequiredEnv('FRONTEND_RESET_URL')
    },

    // ==============================================
    // NOTIFICATIONS (Opcional - no tira el sistema)
    // ==============================================
    notifications: {
      enableWorkers: parseBoolEnv(process.env.ENABLE_NOTIFICATION_WORKERS, false),
      sns: {
        platformArnIos: getOptionalEnv('SNS_PLATFORM_ARN_IOS', ''),
        platformArnAndroid: getOptionalEnv('SNS_PLATFORM_ARN_ANDROID', '')
      },
      ses: {
        fromEmail: getOptionalEnv('SES_FROM_EMAIL', ''),
        logoUrl: getOptionalEnv('LOGO_URL', '')
      }
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
  process.exit(1);
}

module.exports = config;