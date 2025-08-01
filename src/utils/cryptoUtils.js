require('dotenv').config();
const crypto = require('crypto');

const aesKey = Buffer.from(process.env.KEY, 'hex'); // Debe ser de 32 bytes (AES-256)
const iv = Buffer.from(process.env.IV, 'hex'); // Debe ser de 16 bytes (AES usa IV de 128 bits)

/**
 * Encripta un mensaje usando criptografía asimétrica RSA
 * @param {string} mensaje - El mensaje a encriptar
 * @param {string} clavePublica - La clave pública para encriptar (opcional, usa la configurada en .env por defecto)
 * @returns {string} El mensaje encriptado en formato base64
 */
function encriptarMensaje(data) {
    const cipher = crypto.createCipheriv('aes-256-cbc', aesKey, iv);
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

/**
 * Desencripta un mensaje usando criptografía asimétrica RSA
 * @param {string} mensajeEncriptado - El mensaje encriptado en formato base64
 * @param {string} clavePrivada - La clave privada para desencriptar (opcional, usa la configurada en .env por defecto)
 * @returns {string} El mensaje desencriptado
 */
function desencriptarMensaje(encryptedData) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', aesKey, iv);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Genera un token aleatorio para sesiones
 * @param {number} longitud - Longitud del token a generar
 * @returns {string} Token generado
 */
const generarToken = (longitud = 64) => {
    return crypto.randomBytes(longitud).toString('hex');
};

module.exports = {
encriptarMensaje,
desencriptarMensaje,
generarToken
};