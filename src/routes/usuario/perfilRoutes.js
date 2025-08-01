const express = require('express');
const perfilUsuarioController = require('../../controllers/usuario/perfilController');
const { verificarAutenticacion } = require('../../middlewares/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /perfil_usuario/datos_usuario:
 *   get:
 *     summary: Obtener datos del usuario autenticado.
 *     description: Devuelve los datos del usuario autenticado basándose en el token proporcionado.
 *     tags: [perfil_usuario]
 *     parameters:
 *       - in: header
 *         name: authorization
 *         required: false
 *         schema:
 *           type: string
 *         description: Token encriptado de autenticación del usuario.
 *       - in: cookie
 *         name: jwtToken
 *         required: false
 *         schema:
 *           type: string
 *         description: Token JWT en cookie.
 *     responses:
 *       200:
 *         description: Datos del usuario obtenidos correctamente.
 *       210:
 *         description: Token no válido.
 *       500:
 *         description: Error interno del servidor.
 */
router.get('/datos_usuario', verificarAutenticacion, perfilUsuarioController.getDatosUsuario);

module.exports = router;