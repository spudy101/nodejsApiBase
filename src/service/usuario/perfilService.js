const { executeQuery } = require('../../utils/databaseUtils');
const { Usuario, Persona, Avatar, Rol, PrefijoTelefonico } = require('../../models'); // modelsde ejemplo

const getDatosUsuario = async (token) => {
  return await executeQuery(
    { token },
    async (params) => {
      
      const usuario = await Usuario.findOne({
        where: { 
          token: params.token,
          id_rol: [1, 2]
        },
        include: [
          {
            model: Persona,
            include: [PrefijoTelefonico]
          },
          { model: Avatar },
          { model: Rol }
        ]
      });
      
      if (!usuario) {
        return null;
      }
      
      // Transformar a la estructura esperada
      return {
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
        nombre_avatar: `https://nombreBucket.s3.us-east-1.amazonaws.com/avatares/${usuario.Avatar.nombre_avatar}`,
        nombre_rol: usuario.Rol.nombre_rol,
        autentificador: usuario.autentificador,
        prefijo: usuario.Persona.PrefijoTelefonico.prefijo
      };
    },
    'GET_DATOS_USUARIO'
  );
};

module.exports = {
  getDatosUsuario
};