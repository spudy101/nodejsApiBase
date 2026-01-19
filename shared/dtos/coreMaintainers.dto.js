'use strict';

/**
 * DTO base para paginación
 */
class PaginationDto {
  constructor(data) {
    this.currentPage = data.currentPage;
    this.pageSize = data.pageSize;
    this.totalItems = data.totalItems;
    this.totalPages = data.totalPages;
    this.hasNextPage = data.hasNextPage;
    this.hasPreviousPage = data.hasPreviousPage;
  }
}

/**
 * DTO base para ordenamiento
 */
class SortDto {
  constructor(data) {
    this.field = data.field;
    this.order = data.order;
  }
}

/**
 * DTO base para metadata de respuestas paginadas
 */
class MetadataDto {
  constructor(data) {
    this.pagination = new PaginationDto(data.pagination);
    this.sort = new SortDto(data.sort);
    if (data.filters && Object.keys(data.filters).length > 0) {
      this.filters = data.filters;
    }
  }
}

// ==================== GENDER DTOs ====================

/**
 * DTO para Gender
 */
class GenderDto {
  constructor(data) {
    this.gender_id = data.gender_id;
    this.name = data.name;
    this.is_active = data.is_active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * DTO para respuesta de lista de géneros
 */
class ListGendersResponseDto {
  constructor(data, metadata) {
    this.data = Array.isArray(data) ? data.map(gender => new GenderDto(gender)) : [];
    this.metadata = new MetadataDto(metadata);
  }
}

// ==================== PHONE PREFIX DTOs ====================

/**
 * DTO para Country (anidado)
 */
class CountryNestedDto {
  constructor(data) {
    this.country_id = data.country_id;
    this.name = data.name;
    this.code = data.code;
  }
}

/**
 * DTO para PhonePrefix
 */
class PhonePrefixDto {
  constructor(data) {
    this.phone_prefix_id = data.phone_prefix_id;
    this.prefix = data.prefix;
    this.country_id = data.country_id;
    this.is_active = data.is_active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    if (data.country) {
      this.country = new CountryNestedDto(data.country);
    }
  }
}

/**
 * DTO para respuesta de lista de prefijos telefónicos
 */
class ListPhonePrefixesResponseDto {
  constructor(data, metadata) {
    this.data = Array.isArray(data) ? data.map(prefix => new PhonePrefixDto(prefix)) : [];
    this.metadata = new MetadataDto(metadata);
  }
}

// ==================== AVATAR DTOs ====================

/**
 * DTO para AvatarTheme (anidado)
 */
class AvatarThemeNestedDto {
  constructor(data) {
    this.theme_id = data.theme_id;
    this.name = data.name;
  }
}

/**
 * DTO para Avatar
 */
class AvatarDto {
  constructor(data) {
    this.avatar_id = data.avatar_id;
    this.name = data.name;
    this.image_url = data.image_url;
    this.theme_id = data.theme_id;
    this.is_active = data.is_active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    if (data.theme) {
      this.theme = new AvatarThemeNestedDto(data.theme);
    }
  }
}

/**
 * DTO para respuesta de lista de avatares
 */
class ListAvatarsResponseDto {
  constructor(data, metadata) {
    this.data = Array.isArray(data) ? data.map(avatar => new AvatarDto(avatar)) : [];
    this.metadata = new MetadataDto(metadata);
  }
}

// ==================== AVATAR THEME DTOs ====================

/**
 * DTO para AvatarTheme
 */
class AvatarThemeDto {
  constructor(data) {
    this.theme_id = data.theme_id;
    this.name = data.name;
    this.description = data.description;
    this.is_active = data.is_active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * DTO para respuesta de lista de temas de avatares
 */
class ListAvatarThemesResponseDto {
  constructor(data, metadata) {
    this.data = Array.isArray(data) ? data.map(theme => new AvatarThemeDto(theme)) : [];
    this.metadata = new MetadataDto(metadata);
  }
}

// ==================== COUNTRY DTOs ====================

/**
 * DTO para Country
 */
class CountryDto {
  constructor(data) {
    this.country_id = data.country_id;
    this.name = data.name;
    this.code = data.code;
    this.is_active = data.is_active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * DTO para respuesta de lista de países
 */
class ListCountriesResponseDto {
  constructor(data, metadata) {
    this.data = Array.isArray(data) ? data.map(country => new CountryDto(country)) : [];
    this.metadata = new MetadataDto(metadata);
  }
}

// ==================== DEPARTMENT DTOs ====================

/**
 * DTO para Department (anidado)
 */
class DepartmentNestedDto {
  constructor(data) {
    this.department_id = data.department_id;
    this.name = data.name;
  }
}

/**
 * DTO para Department
 */
class DepartmentDto {
  constructor(data) {
    this.department_id = data.department_id;
    this.name = data.name;
    this.country_id = data.country_id;
    this.is_active = data.is_active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    if (data.country) {
      this.country = new CountryNestedDto(data.country);
    }
  }
}

/**
 * DTO para respuesta de lista de departamentos
 */
class ListDepartmentsResponseDto {
  constructor(data, metadata) {
    this.data = Array.isArray(data) ? data.map(department => new DepartmentDto(department)) : [];
    this.metadata = new MetadataDto(metadata);
  }
}

// ==================== CITY DTOs ====================

/**
 * DTO para City
 */
class CityDto {
  constructor(data) {
    this.city_id = data.city_id;
    this.name = data.name;
    this.department_id = data.department_id;
    this.is_active = data.is_active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    if (data.department) {
      this.department = new DepartmentNestedDto(data.department);
    }
  }
}

/**
 * DTO para respuesta de lista de ciudades
 */
class ListCitiesResponseDto {
  constructor(data, metadata) {
    this.data = Array.isArray(data) ? data.map(city => new CityDto(city)) : [];
    this.metadata = new MetadataDto(metadata);
  }
}

// ==================== NOTIFICATION TYPE DTOs ====================

/**
 * DTO para NotificationType
 */
class NotificationTypeDto {
  constructor(data) {
    this.notification_type_id = data.notification_type_id;
    this.code = data.code;
    this.name = data.name;
    this.description = data.description;
    this.supports_push = data.supports_push;
    this.supports_email = data.supports_email;
    this.priority = data.priority;
    this.is_active = data.is_active;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}

/**
 * DTO para respuesta de lista de tipos de notificación
 */
class ListNotificationTypesResponseDto {
  constructor(data, metadata) {
    this.data = Array.isArray(data) ? data.map(type => new NotificationTypeDto(type)) : [];
    this.metadata = new MetadataDto(metadata);
  }
}

// ==================== EXPORTS ====================

module.exports = {
  // Base DTOs
  PaginationDto,
  SortDto,
  MetadataDto,

  // Gender
  GenderDto,
  ListGendersResponseDto,

  // Phone Prefix
  PhonePrefixDto,
  CountryNestedDto,
  ListPhonePrefixesResponseDto,

  // Avatar
  AvatarDto,
  AvatarThemeNestedDto,
  ListAvatarsResponseDto,

  // Avatar Theme
  AvatarThemeDto,
  ListAvatarThemesResponseDto,

  // Country
  CountryDto,
  ListCountriesResponseDto,

  // Department
  DepartmentDto,
  DepartmentNestedDto,
  ListDepartmentsResponseDto,

  // City
  CityDto,
  ListCitiesResponseDto,

  // Notification Type
  NotificationTypeDto,
  ListNotificationTypesResponseDto,
};