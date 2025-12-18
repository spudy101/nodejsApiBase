require('dotenv').config();

// middlewares/requestLockMiddleware.js
const { createRequestLock } = require('../utils/requestLock');

// Cache de locks por ruta
const routeLocks = new Map();

const withRequestLock = (keyExtractor) => {
    return (req, res, next) => {
        const routeKey = req.originalUrl;

        if (!routeLocks.has(routeKey)) {
          console.log("creando request...")
            routeLocks.set(routeKey, createRequestLock());
        }
        const lock = routeLocks.get(routeKey);

        const lockKey = keyExtractor(req);

        
        if (!lockKey) {
            return res.status(400).json({
                estado_solicitud: 0,
                message: 'No se pudo identificar la solicitud'
            });
        }

        if (!lock.acquire(lockKey)) {
            return res.status(429).json({
                estado_solicitud: 0,
                message: 'Ya hay una solicitud en proceso.'
            });
        }

        // Flag para evitar doble release
        let released = false;
        const releaseLock = () => {
            if (!released) {
                released = true;
                lock.release(lockKey);
            }
        };

        res.on('finish', releaseLock);
        res.on('close', releaseLock);

        next();
    };
};

module.exports = {
  withRequestLock
};