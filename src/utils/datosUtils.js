const { executeQuery } = require('./databaseUtils');
const { 
  Usuario, 
  Persona, 
  Avatar, 
  Rol, 
  PrefijoTelefonico
} = require('../models'); // modelos de ejemplo

/**
 * Obtener datos completos del usuario por token
 * @param {string} token - Token del usuario
 * @returns {Promise<object>}
 */
const obtenerDatosUsuarioPorToken = async (token) => {
  return await executeQuery(
    { token },
    async (params) => {
      const usuario = await Usuario.findOne({
        where: { 
          token: params.token,
          id_rol: [1, 2] // Roles permitidos
        },
        include: [
          {
            model: Persona,
            required: true,
            include: [
              {
                model: PrefijoTelefonico,
                required: true
              }
            ]
          },
          {
            model: Avatar,
            required: true
          },
          {
            model: Rol,
            required: true
          }
        ]
      });

      if (!usuario) {
        return null;
      }

      const datosUsuario = {
        id_rol: usuario.id_rol,
        id_persona: usuario.id_persona,
        id_avatar: usuario.id_avatar,
        id_usuario: usuario.id_usuario,
        run: usuario.Persona.run,
        nombres: usuario.Persona.nombres,
        apellidos: usuario.Persona.apellidos,
        fecha_nacimiento: usuario.Persona.fecha_nacimiento,
        correo: usuario.Persona.correo,
        telefono: usuario.Persona.telefono,
        id_prefijo_telefonico: usuario.Persona.id_prefijo_telefonico,
        nombre_avatar: `https://${process.env.BUCKET_NAME || 'abundbank'}.s3.us-east-1.amazonaws.com/avatares/${usuario.Avatar.nombre_avatar}`,
        nombre_rol: usuario.Rol.nombre_rol,
        autentificador: usuario.autentificador,
        prefijo: usuario.Persona.PrefijoTelefonico.prefijo
      };

      return datosUsuario;
    },
    'OBTENER_DATOS_USUARIO_POR_TOKEN'
  );
};

module.exports = {
  obtenerDatosUsuarioPorToken
};