const perfilUsuarioService = require('../../service/usuario/perfilService');

const getDatosUsuario = async (req, res) => {
  try {
    const { token } = req.user;
    
    const result = await perfilUsuarioService.getDatosUsuario(token);
    
    if (result.success) {
      res.status(200).json({
        data: result.data,
        message: 'Solicitud correcta',
        estado_solicitud: 1
      });
    } else {
      res.status(500).json({
        message: 'Error al obtener los datos del usuario.',
        estado_solicitud: 0
      });
    }
  } catch (error) {
    console.error('Error en getDatosUsuario controller:', error.message);
    res.status(500).json({
      message: 'Error al obtener los datos del usuario.',
      estado_solicitud: 0
    });
  }
};

module.exports = {
  getDatosUsuario
};
