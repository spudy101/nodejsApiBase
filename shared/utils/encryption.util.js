// src/utils/encryption.js
const crypto = require('crypto');
const { encryption } = require('../constants');

// 🔹 Cargar claves desde .env
const AES_KEY = Buffer.from(encryption.aesKey, 'hex'); // 32 bytes para AES-256
const AES_IV = Buffer.from(encryption.aesIv, 'hex');   // 16 bytes
const ALGORITHM = encryption.algorithm || 'aes-256-cbc';

class EncryptionUtil {
  /**
   * Encripta datos usando AES-256-CBC
   * @param {string} data - Datos a encriptar
   * @returns {string} Datos encriptados en hex
   */
  static encrypt(data) {
    const cipher = crypto.createCipheriv(ALGORITHM, AES_KEY, AES_IV);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  /**
   * Desencripta datos usando AES-256-CBC
   * @param {string} encryptedData - Datos encriptados en hex
   * @returns {string} Datos desencriptados
   */
  static decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(ALGORITHM, AES_KEY, AES_IV);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  /**
   * Genera hash SHA-256
   */
  static generateHash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Genera string aleatorio
   */
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Genera HMAC
   */
  static generateHMAC(data, secret, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }
}

module.exports = EncryptionUtil;