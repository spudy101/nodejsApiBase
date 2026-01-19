// src/utils/generateKeys.js
const crypto = require('crypto');

/**
 * Script para generar claves de encriptación y API keys
 * Ejecutar: node src/utils/generateKeys.js
 */

/**
 * Genera claves AES para encriptación
 */
function generateEncryptionKeys() {
  // AES-256 requiere 32 bytes (256 bits)
  const aesKey = crypto.randomBytes(32);
  
  // AES-CBC requiere IV de 16 bytes (128 bits)
  const aesIV = crypto.randomBytes(16);

  console.log('\n🔐 Claves de encriptación generadas:\n');
  console.log('Copia estas líneas a tu archivo .env:\n');
  console.log(`AES_KEY=${aesKey.toString('hex')}`);
  console.log(`AES_IV=${aesIV.toString('hex')}`);
  console.log(`ENCRYPTION_ALGORITHM=aes-256-cbc\n`);
}

/**
 * Genera una API key para un servicio externo
 * @param {string} serviceName - Nombre del servicio
 * @returns {string} API key generada
 */
function generateApiKey(serviceName) {
  const prefix = 'key_' + serviceName.toLowerCase().replace(/\s+/g, '_');
  const random = crypto.randomBytes(24).toString('hex');
  return `${prefix}_${random}`;
}

/**
 * Genera múltiples API keys para diferentes servicios
 */
function generateApiKeys() {
  const services = [
    'kyc_service',
    'notifications_service',
    'external_client'
  ];

  console.log('\n🔑 API Keys para servicios externos:\n');
  
  const apiKeys = services.map(service => generateApiKey(service));
  
  console.log('Copia esta línea a tu archivo .env:\n');
  console.log(`EXTERNAL_API_KEYS=${apiKeys.join(',')}\n`);
  
  console.log('API Keys individuales por servicio:\n');
  services.forEach((service, index) => {
    console.log(`${service.toUpperCase()}: ${apiKeys[index]}`);
  });
  console.log('');
}

/**
 * Muestra notas de seguridad
 */
function showSecurityNotes() {
  console.log('⚠️  IMPORTANTE - SEGURIDAD:');
  console.log('- NO compartas estas claves');
  console.log('- NO las subas a Git (verifica tu .gitignore)');
  console.log('- Úsalas solo en tu .env local y en producción');
  console.log('- Cada ambiente (dev/prod) debe tener sus propias claves');
  console.log('- Guarda estas claves en un gestor de secretos (AWS Secrets Manager, etc.)');
  console.log('- Rota las API keys periódicamente\n');
}

/**
 * Genera un API key única para un servicio específico
 */
function generateSingleApiKey() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('\n❌ Debes especificar el nombre del servicio');
    console.log('Uso: node src/utils/generateKeys.js <nombre_servicio>\n');
    console.log('Ejemplo: node src/utils/generateKeys.js kyc_service\n');
    return;
  }

  const serviceName = args[0];
  const apiKey = generateApiKey(serviceName);
  
  console.log(`\n🔑 API Key generada para "${serviceName}":\n`);
  console.log(apiKey);
  console.log('');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2);
  
  // Si se pasa un argumento, generar solo una API key
  if (args.length > 0) {
    generateSingleApiKey();
  } else {
    // Si no, generar todo
    generateEncryptionKeys();
    generateApiKeys();
    showSecurityNotes();
  }
}

module.exports = {
  generateEncryptionKeys,
  generateApiKey,
  generateApiKeys
};