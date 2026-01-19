'use strict';

const genderRepository = require('../repositories/gender.repository');
const phonePrefixRepository = require('../repositories/phonePrefix.repository');
const avatarRepository = require('../repositories/avatar.repository');
const avatarThemeRepository = require('../repositories/avatarTheme.repository');
const countryRepository = require('../repositories/country.repository');
const departmentRepository = require('../repositories/department.repository');
const cityRepository = require('../repositories/city.repository');
const notificationTypeRepository = require('../repositories/notificationType.repository');

const PaginationHelper = require('../utils/paginationHelper.util');
const { logger } = require('../utils/logger.util');

const {
  ListGendersResponseDto,
  ListPhonePrefixesResponseDto,
  ListAvatarsResponseDto,
  ListAvatarThemesResponseDto,
  ListCountriesResponseDto,
  ListDepartmentsResponseDto,
  ListCitiesResponseDto,
  ListNotificationTypesResponseDto,
} = require('../dtos/coreMaintainers.dto');

class MaintainersService {

  // ==================== MÉTODOS PÚBLICOS ====================

  /**
   * Lista géneros con paginación
   * Query params: page, limit, sortBy, order, search, isActive
   */
  async listGenders(query) {
    return this._listPaginatedEntity({
      repository: genderRepository,
      query,
      allowedFilters: ['isActive'],
      entityName: 'Genders',
      DtoClass: ListGendersResponseDto
    });
  }

  /**
   * Lista prefijos telefónicos con paginación
   * Query params: page, limit, sortBy, order, search, isActive, countryId
   */
  async listPhonePrefixes(query) {
    return this._listPaginatedEntity({
      repository: phonePrefixRepository,
      query,
      allowedFilters: ['isActive', 'countryId'],
      entityName: 'Phone prefixes',
      DtoClass: ListPhonePrefixesResponseDto
    });
  }

  /**
   * Lista avatares con paginación
   * Query params: page, limit, sortBy, order, search, isActive, themeId
   */
  async listAvatars(query) {
    return this._listPaginatedEntity({
      repository: avatarRepository,
      query,
      allowedFilters: ['isActive', 'themeId'],
      entityName: 'Avatars',
      DtoClass: ListAvatarsResponseDto
    });
  }

  /**
   * Lista temas de avatares con paginación
   * Query params: page, limit, sortBy, order, search, isActive
   */
  async listAvatarThemes(query) {
    return this._listPaginatedEntity({
      repository: avatarThemeRepository,
      query,
      allowedFilters: ['isActive'],
      entityName: 'Avatar themes',
      DtoClass: ListAvatarThemesResponseDto
    });
  }

  /**
   * Lista países con paginación
   * Query params: page, limit, sortBy, order, search, isActive
   */
  async listCountries(query) {
    return this._listPaginatedEntity({
      repository: countryRepository,
      query,
      allowedFilters: ['isActive'],
      entityName: 'Countries',
      DtoClass: ListCountriesResponseDto
    });
  }

  /**
   * Lista departamentos/estados con paginación
   * Query params: page, limit, sortBy, order, search, isActive, countryId
   */
  async listDepartments(query) {
    return this._listPaginatedEntity({
      repository: departmentRepository,
      query,
      allowedFilters: ['isActive', 'countryId'],
      entityName: 'Departments',
      DtoClass: ListDepartmentsResponseDto
    });
  }

  /**
   * Lista ciudades con paginación
   * Query params: page, limit, sortBy, order, search, isActive, departmentId
   */
  async listCities(query) {
    return this._listPaginatedEntity({
      repository: cityRepository,
      query,
      allowedFilters: ['isActive', 'departmentId'],
      entityName: 'Cities',
      DtoClass: ListCitiesResponseDto
    });
  }

  /**
   * Lista tipos de notificación con paginación
   * Query params: page, limit, sortBy, order, search, isActive, supportsPush, supportsEmail, priority
   */
  async listNotificationTypes(query) {
    return this._listPaginatedEntity({
      repository: notificationTypeRepository,
      query,
      allowedFilters: ['isActive', 'supportsPush', 'supportsEmail', 'priority'],
      entityName: 'Notification types',
      DtoClass: ListNotificationTypesResponseDto
    });
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Método genérico para listar entidades con paginación
   * 
   * @param {Object} config - Configuración del listado
   * @param {Object} config.repository - Repositorio a usar
   * @param {Object} config.query - Query params de la petición
   * @param {Array} config.allowedFilters - Filtros permitidos
   * @param {String} config.entityName - Nombre de la entidad (para logs)
   * @param {Class} config.DtoClass - Clase DTO para la respuesta
   * @returns {Promise<Object>} DTO con datos y metadata
   * @private
   */
  async _listPaginatedEntity({
    repository,
    query,
    allowedFilters = [],
    entityName,
    DtoClass
  }) {
    const paginationParams = PaginationHelper.getPaginationParams(query);
    const filters = PaginationHelper.buildFilters(query, allowedFilters);
    const searchTerm = query.search || null;

    const { rows, count } = await repository.findAllPaginated(
      filters,
      paginationParams,
      searchTerm
    );

    const metadata = PaginationHelper.buildMetadata(
      count,
      paginationParams.page,
      paginationParams.limit,
      searchTerm ? { search: searchTerm, ...filters } : filters,
      { field: paginationParams.sortBy, order: paginationParams.order }
    );

    logger.info(`${entityName} listed successfully`, { 
      totalItems: count, 
      page: paginationParams.page 
    });

    return new DtoClass(rows, {
      pagination: metadata.pagination,
      filters: metadata.filters,
      sort: metadata.sort,
    });
  }
}

module.exports = new MaintainersService();