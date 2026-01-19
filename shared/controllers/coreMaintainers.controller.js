'use strict';

const maintainersService = require('../services/coreMaintainers.service');
const ApiResponse = require('../utils/response.util');
const { logger } = require('../utils/logger.util');

class MaintainersController {
  // ==================== GENDERS ====================

  /**
   * Lista géneros con paginación
   * GET /<admin>o<client>/api/core-maintainers/genders?page=1&limit=10&sortBy=name&order=ASC&search=mujer&isActive=true
   */
  async listGenders(req, res, next) {
    try {
      const { data, metadata } = await maintainersService.listGenders(req.query);
      return ApiResponse.success(res, 'Géneros obtenidos exitosamente', data, 200, metadata);
    } catch (error) {
      logger.error('Error listing genders', { error: error.message });
      next(error);
    }
  }

  // ==================== PHONE PREFIXES ====================

  /**
   * Lista prefijos telefónicos con paginación
   * GET /<admin>o<client>/api/core-maintainers/phone-prefixes?page=1&limit=10&sortBy=prefix&order=ASC&search=56&isActive=true&countryId=uuid
   */
  async listPhonePrefixes(req, res, next) {
    try {
      const { data, metadata } = await maintainersService.listPhonePrefixes(req.query);
      return ApiResponse.success(res, 'Prefijos telefónicos obtenidos exitosamente', data, 200, metadata);
    } catch (error) {
      logger.error('Error listing phone prefixes', { error: error.message });
      next(error);
    }
  }

  // ==================== AVATARS ====================

  /**
   * Lista avatares con paginación
   * GET /<admin>o<client>/api/core-maintainers/avatars?page=1&limit=10&sortBy=name&order=ASC&search=robot&isActive=true&themeId=uuid
   */
  async listAvatars(req, res, next) {
    try {
      const { data, metadata } = await maintainersService.listAvatars(req.query);
      return ApiResponse.success(res, 'Avatares obtenidos exitosamente', data, 200, metadata);
    } catch (error) {
      logger.error('Error listing avatars', { error: error.message });
      next(error);
    }
  }

  // ==================== AVATAR THEMES ====================

  /**
   * Lista temas de avatares con paginación
   * GET /<admin>o<client>/api/core-maintainers/avatar-themes?page=1&limit=10&sortBy=name&order=ASC&search=animales&isActive=true
   */
  async listAvatarThemes(req, res, next) {
    try {
      const { data, metadata } = await maintainersService.listAvatarThemes(req.query);
      return ApiResponse.success(res, 'Temas de avatares obtenidos exitosamente', data, 200, metadata);
    } catch (error) {
      logger.error('Error listing avatar themes', { error: error.message });
      next(error);
    }
  }

  // ==================== COUNTRIES ====================

  /**
   * Lista países con paginación
   * GET /<admin>o<client>/api/core-maintainers/countries?page=1&limit=10&sortBy=name&order=ASC&search=chile&isActive=true
   */
  async listCountries(req, res, next) {
    try {
      const { data, metadata } = await maintainersService.listCountries(req.query);
      return ApiResponse.success(res, 'Países obtenidos exitosamente', data, 200, metadata);
    } catch (error) {
      logger.error('Error listing countries', { error: error.message });
      next(error);
    }
  }

  // ==================== DEPARTMENTS ====================

  /**
   * Lista departamentos/estados con paginación
   * GET /<admin>o<client>/api/core-maintainers/departments?page=1&limit=10&sortBy=name&order=ASC&search=santiago&isActive=true&countryId=uuid
   */
  async listDepartments(req, res, next) {
    try {
      const { data, metadata } = await maintainersService.listDepartments(req.query);
      return ApiResponse.success(res, 'Departamentos obtenidos exitosamente', data, 200, metadata);
    } catch (error) {
      logger.error('Error listing departments', { error: error.message });
      next(error);
    }
  }

  // ==================== CITIES ====================

  /**
   * Lista ciudades con paginación
   * GET /<admin>o<client>/api/core-maintainers/cities?page=1&limit=10&sortBy=name&order=ASC&search=puente&isActive=true&departmentId=uuid
   */
  async listCities(req, res, next) {
    try {
      const { data, metadata } = await maintainersService.listCities(req.query);
      return ApiResponse.success(res, 'Ciudades obtenidas exitosamente', data, 200, metadata);
    } catch (error) {
      logger.error('Error listing cities', { error: error.message });
      next(error);
    }
  }

  // ==================== NOTIFICATION TYPES ====================

  /**
   * Lista tipos de notificación con paginación
   * GET /<admin>o<client>/api/core-maintainers/notification-types?page=1&limit=10&sortBy=name&order=ASC&search=push&isActive=true&supportsPush=true&supportsEmail=true&priority=1
   */
  async listNotificationTypes(req, res, next) {
    try {
      const { data, metadata } = await maintainersService.listNotificationTypes(req.query);
      return ApiResponse.success(res, 'Tipos de notificaciones obtenidos exitosamente', data, 200, metadata);
    } catch (error) {
      logger.error('Error listing notification types', { error: error.message });
      next(error);
    }
  }
}

module.exports = new MaintainersController();