// src/utils/encryption.util.js

'use strict';

const crypto    = require('crypto');
const { encryption } = require('../constants');

const AES_KEY   = Buffer.from(encryption.aesKey, 'hex');  // 32 bytes para AES-256
const AES_IV    = Buffer.from(encryption.aesIv, 'hex');   // 16 bytes
const ALGORITHM = encryption.algorithm || 'aes-256-cbc';

class EncryptionUtil {
  /**
   * Encripta datos usando AES-256-CBC.
   * @param {string} data
   * @returns {string} Hex encriptado
   */
  static encrypt(data) {
    const cipher = crypto.createCipheriv(ALGORITHM, AES_KEY, AES_IV);
    return cipher.update(data, 'utf8', 'hex') + cipher.final('hex');
  }

  /**
   * Desencripta datos usando AES-256-CBC.
   * @param {string} encryptedData - Hex encriptado
   * @returns {string} Texto plano
   */
  static decrypt(encryptedData) {
    const decipher = crypto.createDecipheriv(ALGORITHM, AES_KEY, AES_IV);
    return decipher.update(encryptedData, 'hex', 'utf8') + decipher.final('utf8');
  }

  /**
   * Genera un hash (por defecto SHA-256).
   * @param {string} data
   * @param {string} algorithm
   * @returns {string} Hex
   */
  static generateHash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(data).digest('hex');
  }

  /**
   * Genera un string aleatorio seguro.
   * @param {number} length - Bytes (el string resultante tendrá el doble en hex)
   * @returns {string} Hex
   */
  static generateRandomString(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Genera un HMAC.
   * @param {string} data
   * @param {string} secret
   * @param {string} algorithm
   * @returns {string} Hex
   */
  static generateHmac(data, secret, algorithm = 'sha256') {
    return crypto.createHmac(algorithm, secret).update(data).digest('hex');
  }
}

module.exports = EncryptionUtil;