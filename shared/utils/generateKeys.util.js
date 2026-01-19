// src/utils/generateKeys.js
const crypto = require('crypto');

/**
 * Script para generar claves de encriptación
 * Ejecutar: node src/utils/generateKeys.js
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
  
  console.log('⚠️  IMPORTANTE:');
  console.log('- NO compartas estas claves');
  console.log('- NO las subas a Git');
  console.log('- Úsalas solo en tu .env local y en producción');
  console.log('- Cada ambiente (dev/prod) debe tener sus propias claves\n');
}

// Ejecutar si se llama directamente
if (require.main === module) {
  generateEncryptionKeys();
}

module.exports = generateEncryptionKeys;