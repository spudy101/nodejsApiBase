'use strict';

const { Op } = require('sequelize');

/**
 * Helper global para manejar paginación, ordenamiento y búsqueda
 */
class PaginationHelper {
  /**
   * Extrae y valida parámetros de paginación desde query
   * @param {Object} query - req.query
   * @returns {Object} { page, limit, offset, sortBy, order }
   */
  static getPaginationParams(query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || 10);
    const offset = (page - 1) * limit;

    const sortBy = query.sortBy || 'createdAt';
    const order = (query.order || 'DESC').toUpperCase();

    // Validar que order sea ASC o DESC
    const validOrder = ['ASC', 'DESC'].includes(order) ? order : 'DESC';

    return {
      page,
      limit,
      offset,
      sortBy,
      order: validOrder,
    };
  }

  /**
   * Construye metadata de paginación
   * @param {number} totalItems - Total de registros
   * @param {number} page - Página actual
   * @param {number} limit - Items por página
   * @param {Object} filters - Filtros aplicados (opcional)
   * @param {Object} sort - Ordenamiento aplicado (opcional)
   * @returns {Object} Metadata completa
   */
  static buildMetadata(totalItems, page, limit, filters = null, sort = null) {
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const metadata = {
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
    };

    // Agregar filtros si existen
    if (filters && Object.keys(filters).length > 0) {
      metadata.filters = filters;
    }

    // Agregar sort si existe
    if (sort) {
      metadata.sort = sort;
    }

    return metadata;
  }

  /**
   * Construye condición WHERE para búsqueda en múltiples campos
   * @param {string} searchTerm - Término de búsqueda
   * @param {Array<string>} searchFields - Campos donde buscar
   * @returns {Object} Condición WHERE de Sequelize
   */
  static buildSearchCondition(searchTerm, searchFields = []) {
    if (!searchTerm || searchFields.length === 0) {
      return {};
    }

    const searchConditions = searchFields.map((field) => ({
      [field]: {
        [Op.iLike]: `%${searchTerm}%`,
      },
    }));

    return {
      [Op.or]: searchConditions,
    };
  }

  /**
   * Construye filtros adicionales desde query params
   * @param {Object} query - req.query
   * @param {Array<string>} allowedFilters - Filtros permitidos
   * @returns {Object} Filtros parseados
   */
  static buildFilters(query = {}, allowedFilters = []) {
    const filters = {};

    allowedFilters.forEach((filterKey) => {
      if (query[filterKey] !== undefined) {
        // Convertir strings booleanos
        if (query[filterKey] === 'true') {
          filters[filterKey] = true;
        } else if (query[filterKey] === 'false') {
          filters[filterKey] = false;
        } else {
          filters[filterKey] = query[filterKey];
        }
      }
    });

    return filters;
  }

  /**
   * Normaliza snake_case a camelCase para filtros
   * @param {string} snakeCase - String en snake_case
   * @returns {string} String en camelCase
   */
  static toCamelCase(snakeCase) {
    return snakeCase.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  /**
   * Normaliza camelCase a snake_case para columnas DB
   * @param {string} camelCase - String en camelCase
   * @returns {string} String en snake_case
   */
  static toSnakeCase(camelCase) {
    return camelCase.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }
}

module.exports = PaginationHelper;