// shared/src/utils/encryption.util.js
const crypto = require('crypto');

class EncryptionUtil {
  constructor() {
    this.AES_KEY = null;
    this.AES_IV = null;
    this.ALGORITHM = 'aes-256-cbc';
    this.initialized = false;
  }

  /**
   * Inicializa el util con la configuración del servicio
   * Debe llamarse UNA VEZ al inicio de cada servicio
   * @param {object} encryptionConfig - { aesKey, aesIv, algorithm }
   */
  initialize(encryptionConfig) {
    if (this.initialized) {
      throw new Error('EncryptionUtil already initialized');
    }

    if (!encryptionConfig?.aesKey || !encryptionConfig?.aesIv) {
      throw new Error('Encryption config (aesKey, aesIv) is required');
    }

    this.AES_KEY = Buffer.from(encryptionConfig.aesKey, 'hex');
    this.AES_IV = Buffer.from(encryptionConfig.aesIv, 'hex');
    this.ALGORITHM = encryptionConfig.algorithm || 'aes-256-cbc';
    this.initialized = true;
  }

  /**
   * Verifica que esté inicializado
   * @private
   */
  _checkInitialized() {
    if (!this.initialized) {
      throw new Error('EncryptionUtil not initialized. Call initialize(config.encryption) in server.js first.');
    }
  }

  /**
   * Encripta datos usando AES-256-CBC
   * @param {string} data - Datos a encriptar
   * @returns {string} Datos encriptados en hex
   */
  encrypt(data) {
    this._checkInitialized();
    const cipher = crypto.createCipheriv(this.ALGORITHM, this.AES_KEY, this.AES_IV);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Desencripta datos usando AES-256-CBC
   * @param {string} encryptedData - Datos encriptados en hex
   * @returns {string} Datos desencriptados
   */
  decrypt(encryptedData) {
    this._checkInitialized();
    const decipher = crypto.createDecipheriv(this.ALGORITHM, this.AES_KEY, this.AES_IV);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Genera hash SHA-256
   */
  generateHash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Genera string aleatorio
   */
  generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Genera HMAC
   */
  generateHMAC(data, secret, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }
}

// Exportar singleton
module.exports = new EncryptionUtil();