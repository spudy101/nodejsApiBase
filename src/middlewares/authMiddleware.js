require('dotenv').config();
const { obtenerDatosUsuarioPorToken } = require('../utils/datosUtils');
const { desencriptarMensaje } = require('../utils/cryptoUtils');
const jwt = require('jsonwebtoken');

const SECRET_JWT_KEY = process.env.SECRET_JWT_KEY;

/**
 * Middleware para verificar autenticación de usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const verificarAutenticacion = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    let token;

    const jwtToken = req.cookies.jwtToken;

    if (!jwtToken) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token no proporcionado',
        code: 'AUTH_REQUIRED'
      });
    }

    const infoJwt = jwt.verify(jwtToken, SECRET_JWT_KEY);
    token = infoJwt.token;

    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Token no proporcionado',
        code: 'AUTH_REQUIRED'
      });
    }

    const result = await obtenerDatosUsuarioPorToken(token);

    if (!result.success || !result.data) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. Sesión inválida o expirada',
        code: 'INVALID_SESSION'
      });
    }

    req.usuario = result.data;

    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Middleware para verificar timestamp
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar al siguiente middleware
 */
const verificarTimestamp = async (req, res, next) => {
  try {
    // Obtener el timestamp del header
    const timestamp = req.headers.timestamp;

    if (!timestamp) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado. timestamp no proporcionado',
        code: 'AUTH_REQUIRED'
      });
    }

    // Desencriptar el timestamp
    const timestampDecrypt = await desencriptarMensaje(timestamp);

    if (!timestampDecrypt) {
      return res.status(401).json({
        success: false,
        message: 'Timestamp inválido o corrupto',
        code: 'INVALID_TIMESTAMP'
      });
    }

    // Convertir el timestamp desencriptado a número
    const timestampValue = parseInt(timestampDecrypt, 10);

    if (isNaN(timestampValue)) {
      return res.status(401).json({
        success: false,
        message: 'Formato de timestamp inválido',
        code: 'INVALID_TIMESTAMP_FORMAT'
      });
    }

    // Obtener el timestamp actual en milisegundos
    const ahora = Date.now();

    // Calcular la diferencia en milisegundos
    const diferencia = Math.abs(ahora - timestampValue);

    // Verificar que no haya pasado más de 1 minuto (60000 ms)
    const UN_MINUTO_MS = 60000;

    if (diferencia > UN_MINUTO_MS) {
      return res.status(401).json({
        success: false,
        message: 'Timestamp expirado. La solicitud debe realizarse dentro de 1 minuto',
        code: 'TIMESTAMP_EXPIRED'
      });
    }

    // Opcional: guardar el timestamp en req para uso posterior
    req.timestampValidado = timestampValue;

    next();
  } catch (error) {
    console.error('Error en middleware de verificación de timestamp:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  verificarAutenticacion,
  verificarTimestamp
};