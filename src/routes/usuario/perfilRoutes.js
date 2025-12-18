const express = require('express');
const perfilUsuarioController = require('../../controllers/usuario/perfilController');
const { verificarAutenticacion, verificarTimestamp } = require('../../middlewares/authMiddleware');
const { withRequestLock } = require('../../middlewares/requestLock');

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
 *         name: timestamp
 *         required: true
 *         schema:
 *           type: string
 *         description: Timestamp encriptado, para validar que el response sea reciente.
 *       - in: cookie
 *         name: jwtToken
 *         required: true
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
router.get('/datos_usuario', verificarTimestamp, verificarAutenticacion, withRequestLock((req) => req.user?.party_uuid), perfilUsuarioController.getDatosUsuario);

module.exports = router;