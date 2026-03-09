'use strict';

const { sanitizeForLog }       = require('../utils/logger.util');
const DeviceFingerprintUtil    = require('../utils/device-fingerprint.util');

/**
 * Audit Middleware
 *
 * Genera auditContext con la información de la request y lo adjunta a res.locals.
 * Debe ejecutarse DESPUÉS de CorrelationMiddleware.
 *
 * Cambio respecto a la versión anterior:
 *   - res.locals.fingerprintHash  → SHA-256 del User-Agent normalizado (SIN IP)
 *     Estable entre redes — sirve para identificar dispositivos de confianza en BD.
 *   - res.locals.auditContext.deviceFingerprint sigue siendo el hash (renombrado en locals)
 *
 * Uso en controllers/services:
 *   const { auditContext }   = res.locals;   // contexto completo
 *   const { fingerprintHash } = res.locals;  // solo el hash del dispositivo
 */
const auditMiddleware = (req, res, next) => {
  const fingerprintHash = DeviceFingerprintUtil.generateFromRequest(req);

  res.locals.auditContext = {
    correlationId:    req.correlationId,
    ip:               req.ip || req.connection?.remoteAddress,
    userAgent:        req.headers['user-agent'] || null,
    fingerprintHash,
    method:           req.method,
    path:             req.originalUrl || req.path,
    query:            { ...req.query },
    body:             sanitizeForLog(req.body),
    timestamp:        new Date().toISOString(),
  };

  // Acceso directo al hash sin tener que desestructurar auditContext
  res.locals.fingerprintHash = fingerprintHash;

  next();
};

module.exports = auditMiddleware;