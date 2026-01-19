/**
 * Parámetros comunes reutilizables para paginación, filtros y ordenamiento
 * Uso: En tus paths usa { $ref: '#/components/parameters/PageParam' }
 */

const commonParameters = {
  // ==================== PAGINATION ====================

  PageParam: {
    name: 'page',
    in: 'query',
    description: 'Número de página (inicia en 1)',
    required: false,
    schema: {
      type: 'integer',
      minimum: 1,
      default: 1
    },
    example: 1
  },

  LimitParam: {
    name: 'limit',
    in: 'query',
    description: 'Cantidad de elementos por página',
    required: false,
    schema: {
      type: 'integer',
      minimum: 1,
      maximum: 100,
      default: 10
    },
    example: 10
  },

  // ==================== SORTING ====================

  SortByParam: {
    name: 'sortBy',
    in: 'query',
    description: 'Campo por el cual ordenar (varía según endpoint)',
    required: false,
    schema: {
      type: 'string'
    },
    example: 'createdAt'
  },

  OrderParam: {
    name: 'order',
    in: 'query',
    description: 'Dirección del ordenamiento',
    required: false,
    schema: {
      type: 'string',
      enum: ['ASC', 'DESC'],
      default: 'DESC'
    },
    example: 'DESC'
  },

  // ==================== SEARCH & FILTER ====================

  SearchParam: {
    name: 'search',
    in: 'query',
    description: 'Término de búsqueda (busca en múltiples campos según el endpoint)',
    required: false,
    schema: {
      type: 'string',
      minLength: 1,
      maxLength: 255
    },
    example: 'Juan'
  },

  FilterParam: {
    name: 'filter',
    in: 'query',
    description: 'Filtros adicionales en formato JSON',
    required: false,
    schema: {
      type: 'string'
    },
    example: '{"isActive":true}'
  },

  IsActiveParam: {
    name: 'isActive',
    in: 'query',
    description: 'Filtrar por estado activo/inactivo',
    required: false,
    schema: {
      type: 'boolean'
    },
    example: true
  },

  // ==================== PATH PARAMS ====================

  IdParam: {
    name: 'id',
    in: 'path',
    description: 'ID único del recurso (UUID)',
    required: true,
    schema: {
      type: 'string',
      format: 'uuid'
    },
    example: '123e4567-e89b-12d3-a456-426614174000'
  },

  // ==================== DATE RANGE ====================

  StartDateParam: {
    name: 'startDate',
    in: 'query',
    description: 'Fecha de inicio para filtrar (formato: YYYY-MM-DD)',
    required: false,
    schema: {
      type: 'string',
      format: 'date'
    },
    example: '2024-01-01'
  },

  EndDateParam: {
    name: 'endDate',
    in: 'query',
    description: 'Fecha de fin para filtrar (formato: YYYY-MM-DD)',
    required: false,
    schema: {
      type: 'string',
      format: 'date'
    },
    example: '2024-12-31'
  }
};

module.exports = commonParameters;