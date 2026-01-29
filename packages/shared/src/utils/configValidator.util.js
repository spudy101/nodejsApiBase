// packages/shared/src/utils/configValidator.util.js

/**
 * Config Validator Utility
 * Funciones reutilizables para validar configuración en cualquier servicio
 */

class ConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

/**
 * Parse integer from environment variable
 */
const parseIntEnv = (value, defaultValue) => {
  if (value === undefined || value === '') return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

/**
 * Parse boolean from environment variable
 */
const parseBoolEnv = (value, defaultValue = false) => {
  if (value === undefined || value === '') return defaultValue;
  return value === 'true' || value === '1';
};

/**
 * Get required environment variable
 */
const getRequiredEnv = (key, errorMessage) => {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new ConfigurationError(
      errorMessage || `Variable requerida faltante: ${key}`
    );
  }
  return value;
};

/**
 * Get optional environment variable
 */
const getOptionalEnv = (key, defaultValue) => {
  const value = process.env[key];
  return (value && value.trim() !== '') ? value : defaultValue;
};

/**
 * Validate required variables exist
 */
const validateRequiredVars = (requiredVars, serviceName = 'Service') => {
  const errors = [];
  
  requiredVars.forEach(varName => {
    if (!process.env[varName] || process.env[varName].trim() === '') {
      errors.push(`${varName} es requerido para ${serviceName}`);
    }
  });
  
  if (errors.length > 0) {
    console.error(`\n❌ ERRORES DE CONFIGURACIÓN EN ${serviceName.toUpperCase()}:`);
    errors.forEach(error => console.error(`   • ${error}`));
    console.error('\n💡 Revisa tu .env y completa las variables requeridas.\n');
    throw new ConfigurationError(
      `${serviceName}: Faltan ${errors.length} variable(s) requerida(s)`
    );
  }
};

/**
 * Show configuration warnings
 */
const showWarnings = (warnings, serviceName = 'Service') => {
  if (warnings.length > 0) {
    console.warn(`\n⚠️  ADVERTENCIAS DE CONFIGURACIÓN EN ${serviceName.toUpperCase()}:`);
    warnings.forEach(warning => console.warn(`   ${warning}`));
    console.warn('');
  }
};

/**
 * Validate and show config status
 */
const validateConfig = (errors, warnings, serviceName = 'Service') => {
  showWarnings(warnings, serviceName);
  
  if (errors.length > 0) {
    console.error(`\n❌ ERRORES DE CONFIGURACIÓN EN ${serviceName.toUpperCase()}:`);
    errors.forEach(error => console.error(`   • ${error}`));
    console.error('\n💡 Revisa tu .env y completa las variables requeridas.\n');
    throw new ConfigurationError(
      `${serviceName}: Faltan ${errors.length} variable(s) requerida(s)`
    );
  }

  console.log(`✅ Configuración de ${serviceName} validada correctamente\n`);
};

module.exports = {
  ConfigurationError,
  parseIntEnv,
  parseBoolEnv,
  getRequiredEnv,
  getOptionalEnv,
  validateRequiredVars,
  showWarnings,
  validateConfig
};