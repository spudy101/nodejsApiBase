const express = require('express');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const perfilRoutesUsuario = require('./usuario/perfilRoutes');

const router = express.Router();

// Rate limit global con manejo robusto de IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => ipKeyGenerator(req),
  message: {
    success: false,
    message: 'Demasiadas solicitudes, espera un momento'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Todo lo demás CON rate limit
router.use(globalLimiter);

// Rutas de autenticación
router.use('/perfil_usuario', perfilRoutesUsuario);

module.exports = router;