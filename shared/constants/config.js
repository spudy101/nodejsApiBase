// src/config/index.js

/**
 * Configuration module
 *
 * Responsabilidad única: leer, parsear y validar variables de entorno.
 * Las constantes fijas de la aplicación viven en src/constants/index.js
 */

'use strict';

// ==============================================
// CUSTOM ERROR
// ==============================================

class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

// ==============================================
// HELPERS — parseo de env vars
// ==============================================

/**
 * Parsea una variable de entorno como entero.
 * @param {string|undefined} value
 * @param {number} defaultValue
 * @returns {number}
 */
const parseIntEnv = (value, defaultValue) => {
  if (value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parsea una variable de entorno como booleano.
 * Acepta 'true' | '1' como verdadero, cualquier otra cosa es falso.
 * @param {string|undefined} value
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
const parseBoolEnv = (value, defaultValue = false) => {
  if (value === undefined || value === '') return defaultValue;
  return value === 'true' || value === '1';
};

/**
 * Obtiene una variable de entorno requerida.
 * Lanza ConfigurationError si no existe o está vacía.
 * @param {string} key
 * @returns {string}
 */
const getRequiredEnv = (key) => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new ConfigurationError(`Variable de entorno requerida faltante: ${key}`);
  }
  return value.trim();
};

/**
 * Obtiene una variable de entorno opcional.
 * Retorna defaultValue si no existe o está vacía.
 * @param {string} key
 * @param {string} defaultValue
 * @returns {string}
 */
const getOptionalEnv = (key, defaultValue = '') => {
  const value = process.env[key];
  return value && value.trim() !== '' ? value.trim() : defaultValue;
};

// ==============================================
// VALIDATORS — cada sección valida su propio dominio
// ==============================================

const validateNodeEnv = (warnings) => {
  const validEnvs = ['development', 'production', 'test'];
  const nodeEnv = process.env.NODE_ENV;
  if (!validEnvs.includes(nodeEnv)) {
    warnings.push(`NODE_ENV="${nodeEnv}" no es estándar. Valores válidos: ${validEnvs.join(', ')}`);
  }
};

const validateDatabase = (errors) => {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD', 'DB_DIALECT'];
  required.forEach((key) => {
    if (!process.env[key]) errors.push(`DB — variable requerida faltante: ${key}`);
  });
};

const validateEncryption = (errors) => {
  if (!process.env.AES_KEY) errors.push('ENCRYPTION — AES_KEY es requerido');
  if (!process.env.AES_IV) errors.push('ENCRYPTION — AES_IV es requerido');
};

const validateCors = (warnings) => {
  if (process.env.NODE_ENV === 'production' && process.env.CORS_ORIGIN === '*') {
    warnings.push('CORS_ORIGIN="*" en producción es inseguro. Define los orígenes permitidos.');
  }
};

const validateAws = (errors) => {
  const required = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'BUCKET_NAME'];
  required.forEach((key) => {
    if (!process.env[key]) errors.push(`AWS — variable requerida faltante: ${key}`);
  });
};

const validateCognito = (errors) => {
  const required = ['COGNITO_USER_POOL_ID', 'COGNITO_CLIENT_ID'];
  required.forEach((key) => {
    if (!process.env[key]) errors.push(`COGNITO — variable requerida faltante: ${key}`);
  });
};

const validateFrontend = (errors) => {
  if (!process.env.FRONTEND_RESET_URL) {
    errors.push('FRONTEND — FRONTEND_RESET_URL es requerido');
  }
};

// ==============================================
// VALIDACIÓN GLOBAL
// ==============================================

const validateConfig = () => {
  const errors = [];
  const warnings = [];

  validateNodeEnv(warnings);
  validateDatabase(errors);
  validateEncryption(errors);
  validateCors(warnings);
  validateAws(errors);
  validateCognito(errors);
  validateFrontend(errors);

  return { errors, warnings };
};

// ==============================================
// LOADER
// ==============================================

const loadConfig = () => {
  const { errors, warnings } = validateConfig();

  if (warnings.length > 0) {
    console.warn('\n⚠️  ADVERTENCIAS DE CONFIGURACIÓN:');
    warnings.forEach((w) => console.warn(`   ${w}`));
    console.warn('');
  }

  if (errors.length > 0) {
    console.error('\n❌ ERRORES DE CONFIGURACIÓN:');
    errors.forEach((e) => console.error(`   • ${e}`));
    console.error('\n💡 Revisa tu .env y completa las variables requeridas.\n');
    throw new ConfigurationError(`Faltan ${errors.length} variable(s) de entorno requerida(s)`);
  }

  console.log('✅ Configuración validada correctamente\n');

  return {
    server: {
      nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
      port: parseIntEnv(process.env.PORT, 4000),
      host: getOptionalEnv('HOST', 'localhost'),
      corsOrigin: getOptionalEnv('CORS_ORIGIN', '*'),
    },

    database: {
      host: getRequiredEnv('DB_HOST'),
      port: parseIntEnv(process.env.DB_PORT, 5432),
      name: getRequiredEnv('DB_NAME'),
      user: getRequiredEnv('DB_USER'),
      password: getRequiredEnv('DB_PASSWORD'),
      dialect: getRequiredEnv('DB_DIALECT'),
      logging: parseBoolEnv(process.env.DB_LOGGING, false),

      schema_kyc: getOptionalEnv('DB_SCHEMA_KYC', 'public'),
      schema_notification: getOptionalEnv('DB_SCHEMA_NOTIFICATION', 'public'),
    },

    // Redis es opcional — si no está configurado, el sistema usa caché en memoria
    redis: {
      enabled: !!(process.env.REDIS_HOST || process.env.REDIS_URL),
      url: getOptionalEnv('REDIS_URL'),
      host: getOptionalEnv('REDIS_HOST', 'localhost'),
      port: parseIntEnv(process.env.REDIS_PORT, 6379),
      password: getOptionalEnv('REDIS_PASSWORD'),
      db: parseIntEnv(process.env.REDIS_DB, 0),
    },

    encryption: {
      aesKey: getRequiredEnv('AES_KEY'),
      aesIv: getRequiredEnv('AES_IV'),
      algorithm: getOptionalEnv('ENCRYPTION_ALGORITHM', 'aes-256-cbc'),
      externalApiKeys: getOptionalEnv('EXTERNAL_API_KEYS'),
    },

    aws: {
      region: getRequiredEnv('AWS_REGION'),
      accessKeyId: getRequiredEnv('AWS_ACCESS_KEY_ID'),
      secretAccessKey: getRequiredEnv('AWS_SECRET_ACCESS_KEY'),
      s3BucketName: getRequiredEnv('BUCKET_NAME'),
    },

    cognito: {
      userPoolId: getRequiredEnv('COGNITO_USER_POOL_ID'),
      clientId: getRequiredEnv('COGNITO_CLIENT_ID'),
    },

    frontend: {
      resetCredentialUrl: getRequiredEnv('FRONTEND_RESET_URL'),
    },

    // Notificaciones son opcionales — el sistema no falla si no están configuradas
    notifications: {
      sns: {
        platformArnIos: getOptionalEnv('SNS_PLATFORM_ARN_IOS'),
        platformArnAndroid: getOptionalEnv('SNS_PLATFORM_ARN_ANDROID'),
      },
      ses: {
        fromEmail: getOptionalEnv('SES_FROM_EMAIL'),
        logoUrl: getOptionalEnv('LOGO_URL'),
        adminEmail: getOptionalEnv('ADMIN_EMAIL'),
      },
    },

    workers: {
      enabled: parseBoolEnv(process.env.ENABLE_WORKERS, true),
    },

    logging: {
      level: getOptionalEnv('LOG_LEVEL', 'info'),
    },
  };
};

// ==============================================
// SINGLETON — se valida una sola vez al arrancar
// ==============================================

let config;

try {
  config = loadConfig();
} catch (error) {
  if (error instanceof ConfigurationError) {
    process.exit(1);
  }
  throw error; // Errores inesperados no se silencian
}

module.exports = config;