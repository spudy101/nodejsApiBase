const crypto = require('crypto');
const logger = require('./logger');

// Configuración
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const ITERATIONS = 100000;

// Obtener o generar la clave de encriptación
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  logger.warn('⚠️  ENCRYPTION_KEY no está definido en .env. Se generará una clave temporal.');
}

/**
 * Genera una clave derivada desde una contraseña
 * @param {String} password - Contraseña base
 * @param {Buffer} salt - Salt para derivar la clave
 * @returns {Buffer} Clave derivada
 */
const deriveKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512');
};

/**
 * Encripta un texto o JSON
 * @param {String|Object} data - Datos a encriptar
 * @returns {String} Datos encriptados en formato: salt:iv:tag:encryptedData
 */
const encrypt = (data) => {
  try {
    // Convertir objeto a string si es necesario
    const text = typeof data === 'object' ? JSON.stringify(data) : String(data);

    // Generar salt e IV aleatorios
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derivar clave desde la ENCRYPTION_KEY
    const key = deriveKey(ENCRYPTION_KEY || 'default-key-change-in-production', salt);

    // Crear cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encriptar
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Obtener authentication tag
    const tag = cipher.getAuthTag();

    // Retornar: salt:iv:tag:encryptedData
    const result = [
      salt.toString('hex'),
      iv.toString('hex'),
      tag.toString('hex'),
      encrypted
    ].join(':');

    logger.debug('Datos encriptados exitosamente');
    return result;

  } catch (error) {
    logger.error('Error al encriptar datos', { error: error.message });
    throw new Error('Error al encriptar datos');
  }
};

/**
 * Desencripta datos previamente encriptados
 * @param {String} encryptedData - Datos en formato: salt:iv:tag:encryptedData
 * @returns {String|Object} Datos desencriptados (parseados como JSON si es posible)
 */
const decrypt = (encryptedData) => {
  try {
    // Separar componentes
    const parts = encryptedData.split(':');
    
    if (parts.length !== 4) {
      throw new Error('Formato de datos encriptados inválido');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const tag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    // Derivar clave
    const key = deriveKey(ENCRYPTION_KEY || 'default-key-change-in-production', salt);

    // Crear decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    // Desencriptar
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    logger.debug('Datos desencriptados exitosamente');

    // Intentar parsear como JSON
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }

  } catch (error) {
    logger.error('Error al desencriptar datos', { error: error.message });
    throw new Error('Error al desencriptar datos');
  }
};

/**
 * Hash de una sola vía (para passwords, no reversible)
 * @param {String} data - Datos a hashear
 * @param {String} salt - Salt opcional (se genera automáticamente si no se provee)
 * @returns {Object} { hash, salt }
 */
const hash = (data, salt = null) => {
  try {
    const saltToUse = salt || crypto.randomBytes(SALT_LENGTH).toString('hex');
    const hash = crypto.pbkdf2Sync(data, saltToUse, ITERATIONS, KEY_LENGTH, 'sha512').toString('hex');

    logger.debug('Hash generado exitosamente');
    return {
      hash,
      salt: saltToUse
    };

  } catch (error) {
    logger.error('Error al generar hash', { error: error.message });
    throw new Error('Error al generar hash');
  }
};

/**
 * Verifica un hash (para passwords)
 * @param {String} data - Dato a verificar
 * @param {String} hash - Hash guardado
 * @param {String} salt - Salt usado en el hash
 * @returns {Boolean} true si coincide
 */
const verifyHash = (data, hash, salt) => {
  try {
    const calculatedHash = crypto.pbkdf2Sync(data, salt, ITERATIONS, KEY_LENGTH, 'sha512').toString('hex');
    return calculatedHash === hash;

  } catch (error) {
    logger.error('Error al verificar hash', { error: error.message });
    return false;
  }
};

/**
 * Genera un token aleatorio seguro
 * @param {Number} length - Longitud del token en bytes (default: 32)
 * @returns {String} Token hexadecimal
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Genera un UUID v4
 * @returns {String} UUID
 */
const generateUUID = () => {
  return crypto.randomUUID();
};

/**
 * Hash rápido para identificadores (MD5)
 * NOTA: No usar para passwords, solo para identificadores únicos
 * @param {String} data - Datos a hashear
 * @returns {String} Hash MD5
 */
const quickHash = (data) => {
  return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Encripta datos sensibles para almacenar en BD
 * Útil para: tokens de API, datos de tarjetas, etc.
 * @param {String|Object} data - Datos sensibles
 * @returns {String} Datos encriptados
 */
const encryptSensitiveData = (data) => {
  logger.info('Encriptando datos sensibles');
  return encrypt(data);
};

/**
 * Desencripta datos sensibles desde BD
 * @param {String} encryptedData - Datos encriptados
 * @returns {String|Object} Datos originales
 */
const decryptSensitiveData = (encryptedData) => {
  logger.info('Desencriptando datos sensibles');
  return decrypt(encryptedData);
};

module.exports = {
  encrypt,
  decrypt,
  hash,
  verifyHash,
  generateSecureToken,
  generateUUID,
  quickHash,
  encryptSensitiveData,
  decryptSensitiveData
};