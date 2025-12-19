const crypto = require('crypto');
const logger = require('../utils/logger');
const { errorResponse } = require('../utils/responseHandler');

// Almacén en memoria para requests en proceso
// En producción, usar Redis
const requestStore = new Map();

// Limpiar requests antiguos cada 5 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestStore.entries()) {
    if (now - value.timestamp > 5 * 60 * 1000) { // 5 minutos
      requestStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Genera una clave única para la request
 */
const generateRequestKey = (req) => {
  const userId = req.user?.id || 'anonymous';
  const method = req.method;
  const path = req.path;
  const body = JSON.stringify(req.body);
  
  const data = `${userId}-${method}-${path}-${body}`;
  return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Middleware para prevenir requests duplicados simultáneos
 * Útil para prevenir doble submit en formularios
 */
const requestLock = (options = {}) => {
  const {
    timeout = 5000, // Tiempo máximo de espera (5 segundos)
    message = 'Petición duplicada en proceso, por favor espera'
  } = options;

  return async (req, res, next) => {
    // Solo aplicar a métodos que modifican datos
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    const requestKey = generateRequestKey(req);

    // Verificar si existe una request idéntica en proceso
    if (requestStore.has(requestKey)) {
      const existingRequest = requestStore.get(requestKey);
      const timeDiff = Date.now() - existingRequest.timestamp;

      // Si la request lleva menos del timeout, rechazar
      if (timeDiff < timeout) {
        logger.warn('Request duplicado detectado', {
          requestKey,
          userId: req.user?.id,
          method: req.method,
          path: req.path,
          timeDiff: `${timeDiff}ms`
        });

        return errorResponse(res, message, 409);
      }

      // Si ya pasó el timeout, eliminar y permitir
      requestStore.delete(requestKey);
    }

    // Registrar la nueva request
    requestStore.set(requestKey, {
      timestamp: Date.now(),
      userId: req.user?.id,
      method: req.method,
      path: req.path
    });

    logger.debug('Request registrado en lock', {
      requestKey,
      userId: req.user?.id,
      method: req.method,
      path: req.path
    });

    // Limpiar después de que termine la request
    const cleanup = () => {
      requestStore.delete(requestKey);
      logger.debug('Request lock liberado', { requestKey });
    };

    // Cleanup en finish o error
    res.on('finish', cleanup);
    res.on('close', cleanup);

    next();
  };
};

/**
 * Obtener estadísticas del request lock
 */
const getRequestLockStats = () => {
  return {
    activeRequests: requestStore.size,
    requests: Array.from(requestStore.entries()).map(([key, value]) => ({
      key,
      age: Date.now() - value.timestamp,
      ...value
    }))
  };
};

module.exports = {
  requestLock,
  getRequestLockStats
};