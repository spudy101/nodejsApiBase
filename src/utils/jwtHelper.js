const jwt = require('jsonwebtoken');
const logger = require('./logger');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET no está definido en las variables de entorno');
}

/**
 * Genera un token JWT
 * @param {Object} payload - Datos a incluir en el token (id, email, role)
 * @param {String} expiresIn - Tiempo de expiración (opcional)
 * @returns {String} Token JWT
 */
const generateToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
  try {
    // Solo incluir datos mínimos necesarios
    const tokenPayload = {
      id: payload.id,
      email: payload.email,
      role: payload.role
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, {
      expiresIn,
      issuer: 'your-app-name', // Cambia esto por el nombre de tu app
      audience: 'your-app-users'
    });

    logger.debug('Token generado exitosamente', { userId: payload.id });
    return token;

  } catch (error) {
    logger.error('Error al generar token', { error: error.message });
    throw new Error('Error al generar token de autenticación');
  }
};

/**
 * Verifica y decodifica un token JWT
 * @param {String} token - Token JWT a verificar
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'your-app-name',
      audience: 'your-app-users'
    });

    logger.debug('Token verificado exitosamente', { userId: decoded.id });
    return decoded;

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expirado', { expiredAt: error.expiredAt });
      throw new Error('Token expirado');
    }

    if (error.name === 'JsonWebTokenError') {
      logger.warn('Token inválido', { error: error.message });
      throw new Error('Token inválido');
    }

    logger.error('Error al verificar token', { error: error.message });
    throw new Error('Error al verificar token');
  }
};

/**
 * Decodifica un token sin verificar (útil para debugging)
 * @param {String} token - Token JWT a decodificar
 * @returns {Object} Payload decodificado
 */
const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    logger.error('Error al decodificar token', { error: error.message });
    return null;
  }
};

/**
 * Genera un refresh token (token de larga duración)
 * @param {Object} payload - Datos a incluir en el token
 * @returns {String} Refresh token
 */
const generateRefreshToken = (payload) => {
  return generateToken(payload, '7d'); // 7 días
};

module.exports = {
  generateToken,
  verifyToken,
  decodeToken,
  generateRefreshToken
};