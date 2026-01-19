// src/middlewares/idempotency.middleware.js
const redisClient = require('../utils/redis');
const localCache = require('../utils/cache');
const { logger } = require('../utils/logger');
const ApiResponse = require('../utils/response');

/**
 * Idempotency - Previene ejecución duplicada de operaciones
 * El cliente envía header: Idempotency-Key: <uuid>
 */
class IdempotencyMiddleware {
  static handle(req, res, next) {
    // Solo para operaciones de escritura
    if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
      return next();
    }

    const idempotencyKey = req.headers['idempotency-key'];
    
    // Header es opcional
    if (!idempotencyKey) {
      return next();
    }

    const fullKey = `idempotency:${idempotencyKey}`;
    const cache = redisClient.isAvailable() ? redisClient : localCache;

    // Verificar si ya existe respuesta cacheada
    cache.get(fullKey)
      .then(cachedData => {
        if (cachedData) {
          // Retornar respuesta cacheada
          const cached = typeof cachedData === 'string' 
            ? JSON.parse(cachedData) 
            : cachedData;
          
          logger.info('Idempotent request - cached response', {
            key: idempotencyKey,
            path: req.path
          });
          
          return res.status(cached.statusCode).json(cached.body);
        }

        // No hay cache, interceptar respuesta
        const originalJson = res.json.bind(res);
        res.json = function(body) {
          // Solo cachear respuestas exitosas
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const cacheData = {
              statusCode: res.statusCode,
              body
            };
            
            // Cachear por 24 horas
            cache.set(fullKey, JSON.stringify(cacheData), 86400)
              .catch(err => logger.error('Error caching idempotency', err));
          }
          return originalJson(body);
        };

        next();
      })
      .catch(error => {
        logger.error('Idempotency middleware error', { error: error.message });
        next(); // Continuar en caso de error
      });
  }
}

module.exports = IdempotencyMiddleware;