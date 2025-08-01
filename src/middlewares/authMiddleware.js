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
    if (req.headers.authorization){
      const jwtTokenEncrypt = req.headers.authorization;
      const jwtToken = desencriptarMensaje(jwtTokenEncrypt);
      const infoJwt = jwt.verify(jwtToken, SECRET_JWT_KEY);
      token = infoJwt.token;
    } else {
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
    }
    
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

module.exports = {
  verificarAutenticacion
};