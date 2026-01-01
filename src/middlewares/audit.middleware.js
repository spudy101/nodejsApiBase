const sanitizeBody = require('../utils/sanitizeAuditBody');

const auditContextMiddleware = (req, res, next) => {
  res.locals.auditContext = {
    ip: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
    method: req.method,
    path: req.originalUrl || req.path,
    query: { ...req.query },        // 🔥 CLON
    body: sanitizeBody(req.body),   // 🔥 OBJETO PLANO
    requestId: req.id               // opcional (si usas correlation-id)
  };

  next();
};

module.exports = auditContextMiddleware;
