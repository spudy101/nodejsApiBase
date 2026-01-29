'use strict';

const sanitizeBody = require('../utils/sanitizeAuditBody.util');
const DeviceFingerprint = require('../utils/deviceFingerprint.util');

/**
 * Middleware de auditoría
 * Genera auditContext con información de la request
 * Se ejecuta DESPUÉS de CorrelationMiddleware
 */
const auditContextMiddleware = (req, res, next) => {
  // Generar device fingerprint UNA SOLA VEZ
  const deviceFingerprint = DeviceFingerprint.generate(req);

  // Crear audit context completo
  res.locals.auditContext = {
    correlationId: req.correlationId, // ✅ Agregado
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    device_fingerprint: deviceFingerprint,
    method: req.method,
    path: req.originalUrl || req.path,
    query: { ...req.query },
    body: sanitizeBody.sanitizeAuditBody(req.body),
    requestId: req.id,
    timestamp: new Date().toISOString(),
  };

  // También guardarlo directamente para fácil acceso
  res.locals.deviceFingerprint = deviceFingerprint;

  next();
};

module.exports = auditContextMiddleware;