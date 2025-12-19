const { verifyToken } = require('../utils/jwtHelper');
const { errorResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');
const { User } = require('../models');

/**
 * Middleware para verificar JWT
 */
const authenticate = async (req, res, next) => {
  try {

    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Token de autenticación no proporcionado', 401);
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar y decodificar token
    const decoded = verifyToken(token);

    // Opcional: Verificar que el usuario existe y está activo
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'email', 'role', 'isActive']
    });

    if (!user) {
      return errorResponse(res, 'Usuario no encontrado', 401);
    }

    if (!user.isActive) {
      return errorResponse(res, 'Usuario inactivo', 403);
    }

    // Agregar usuario al request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    logger.debug('Usuario autenticado', {
      userId: user.id,
      email: user.email,
      role: user.role
    });

    next();

  } catch (error) {
    logger.warn('Error en autenticación', {
      error: error.message,
      ip: req.ip,
      url: req.originalUrl
    });

    if (error.message === 'Token expirado') {
      return errorResponse(res, 'Tu sesión ha expirado, por favor inicia sesión nuevamente', 401);
    }

    if (error.message === 'Token inválido') {
      return errorResponse(res, 'Token de autenticación inválido', 401);
    }

    return errorResponse(res, 'Error al verificar autenticación', 401);
  }
};

/**
 * Middleware para verificar roles
 * @param {Array<String>} allowedRoles - Roles permitidos ['admin', 'user']
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Usuario no autenticado', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Acceso denegado por rol', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
        url: req.originalUrl
      });

      return errorResponse(
        res, 
        'No tienes permisos para acceder a este recurso', 
        403
      );
    }

    next();
  };
};

/**
 * Middleware para verificar que el usuario accede a sus propios recursos
 * o es admin
 */
const authorizeOwnerOrAdmin = (paramName = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[paramName] || req.body[paramName];
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (resourceUserId !== currentUserId && !isAdmin) {
      logger.warn('Acceso denegado - no es owner ni admin', {
        userId: currentUserId,
        resourceUserId,
        url: req.originalUrl
      });

      return errorResponse(
        res,
        'No tienes permisos para acceder a este recurso',
        403
      );
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 * Si hay token, lo valida. Si no hay, continúa sin user
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = verifyToken(token);

      const user = await User.findByPk(decoded.id, {
        attributes: ['id', 'email', 'role', 'isActive']
      });

      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role
        };
      }
    }

    next();

  } catch (error) {
    // Si falla, simplemente continuar sin usuario
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  authorizeOwnerOrAdmin,
  optionalAuth
};