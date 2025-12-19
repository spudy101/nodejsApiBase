/**
 * Maneja respuestas exitosas de forma estandarizada
 * @param {Object} res - Response object de Express
 * @param {Object} data - Datos a enviar
 * @param {String} message - Mensaje descriptivo
 * @param {Number} statusCode - Código HTTP (default: 200)
 */
const successResponse = (res, data = null, message = 'Operación exitosa', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Maneja respuestas de error de forma estandarizada
 * @param {Object} res - Response object de Express
 * @param {String} message - Mensaje de error
 * @param {Number} statusCode - Código HTTP (default: 500)
 * @param {Object} errors - Detalles adicionales del error
 */
const errorResponse = (res, message = 'Error en el servidor', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  // Solo incluir detalles de errores en desarrollo
  if (process.env.NODE_ENV === 'development' && errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Maneja respuestas de validación fallida
 * @param {Object} res - Response object de Express
 * @param {Array} errors - Array de errores de validación
 */
const validationErrorResponse = (res, errors) => {
  return res.status(400).json({
    success: false,
    message: 'Errores de validación',
    errors: errors.map(err => ({
      field: err.path || err.param,
      message: err.msg || err.message
    })),
    timestamp: new Date().toISOString()
  });
};

/**
 * Maneja respuestas paginadas
 * @param {Object} res - Response object de Express
 * @param {Array} data - Datos paginados
 * @param {Number} page - Página actual
 * @param {Number} limit - Límite por página
 * @param {Number} total - Total de registros
 * @param {String} message - Mensaje descriptivo
 */
const paginatedResponse = (res, data, page, limit, total, message = 'Datos obtenidos exitosamente') => {
  const totalPages = Math.ceil(total / limit);
  
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    timestamp: new Date().toISOString()
  });
};

module.exports = {
  successResponse,
  errorResponse,
  validationErrorResponse,
  paginatedResponse
};