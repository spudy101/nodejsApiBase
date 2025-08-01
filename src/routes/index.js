const express = require('express');
const perfilRoutesUsuario = require('./usuario/perfilRoutes');

const router = express.Router();

// Rutas de autenticación
router.use('/perfil_usuario', perfilRoutesUsuario);

module.exports = router;