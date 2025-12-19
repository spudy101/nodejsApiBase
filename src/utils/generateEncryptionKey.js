const crypto = require('crypto');

console.log('\n🔐 Generando clave de encriptación segura...\n');

// Generar clave aleatoria de 32 bytes (256 bits)
const key = crypto.randomBytes(32).toString('hex');

console.log('Copia esta clave a tu archivo .env:');
console.log('=====================================');
console.log(`ENCRYPTION_KEY=${key}`);
console.log('=====================================\n');

console.log('⚠️  IMPORTANTE:');
console.log('- Nunca compartas esta clave');
console.log('- Usa una clave diferente en cada ambiente (dev, staging, prod)');
console.log('- Si cambias la clave, los datos encriptados anteriores no podrán desencriptarse');
console.log('- Guarda esta clave en un lugar seguro (gestores de secretos en producción)\n');