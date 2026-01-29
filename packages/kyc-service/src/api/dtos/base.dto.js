'use strict';

/**
 * DTOs Base - Componentes reutilizables
 * 
 * Estos builders evitan duplicación de código en los DTOs
 * y mantienen consistencia en la estructura de respuestas
 */

class UserBaseDTO {
  /**
   * Builder de datos básicos de usuario
   * Usado en: LoginResponseDTO, BasicProfileDTO, UserDto, etc.
   */
  static buildUserBasic(user) {
    if (!user) return null;

    return {
      userId: user.user_id || user.id,
      username: user.username,
      isActive: user.is_active,
      mfaEnabled: user.totp_enabled || false,
    };
  }

  /**
   * Builder de persona básica
   */
  static buildPersonBasic(person) {
    if (!person) return null;

    return {
      personId: person.person_id || person.id,
      firstName: person.first_name,
      lastName: person.last_name,
      nationalId: person.national_id,
      birthDate: person.birth_date,
      genderId: person.gender_id,
      countryId: person.country_id,
    };
  }

  /**
   * Builder de rol
   */
  static buildRole(role) {
    if (!role) return null;

    return {
      roleId: role.role_id || role.id,
      name: role.name,
      description: role.description,
    };
  }

  /**
   * Builder de avatar
   */
  static buildAvatar(avatar) {
    if (!avatar) return null;

    return {
      avatarId: avatar.avatar_id || avatar.id,
      name: avatar.name,
      imageUrl: avatar.image_url || avatar.url,
    };
  }

  /**
   * Builder de avatar con tema
   */
  static buildAvatarWithTheme(avatar) {
    if (!avatar) return null;

    const avatarData = this.buildAvatar(avatar);

    if (avatar.avatar_theme) {
      avatarData.theme = {
        themeId: avatar.avatar_theme.avatar_theme_id || avatar.avatar_theme.id,
        name: avatar.avatar_theme.name,
      };
    }

    return avatarData;
  }

  /**
   * Builder de género
   */
  static buildGender(gender) {
    if (!gender) return null;

    return {
      genderId: gender.gender_id || gender.id,
      name: gender.name,
    };
  }

  /**
   * Builder de país
   */
  static buildCountry(country) {
    if (!country) return null;

    return {
      countryId: country.country_id || country.id,
      name: country.name,
      code: country.code,
      iconUrl: country.icon_url,
    };
  }

  /**
   * Builder de contacto
   */
  static buildContact(contact) {
    if (!contact) return null;

    const contactData = {
      email: contact.email,
      emailVerifiedAt: contact.email_verified_at,
      phonePrimary: contact.phone_primary,
      phonePrimaryVerifiedAt: contact.phone_primary_verified_at,
      phoneSecondary: contact.phone_secondary,
      phoneSecondaryVerifiedAt: contact.phone_secondary_verified_at,
    };

    // Agregar prefijos si existen
    if (contact.phone_primary_prefix) {
      contactData.phonePrimaryPrefix = {
        prefixId: contact.phone_primary_prefix.phone_prefix_id || contact.phone_primary_prefix.id,
        prefix: contact.phone_primary_prefix.prefix,
      };
    }

    if (contact.phone_secondary_prefix) {
      contactData.phoneSecondaryPrefix = {
        prefixId: contact.phone_secondary_prefix.phone_prefix_id || contact.phone_secondary_prefix.id,
        prefix: contact.phone_secondary_prefix.prefix,
      };
    }

    return contactData;
  }

  /**
   * Builder de ubicación
   */
  static buildLocation(location) {
    if (!location) return null;

    const locationData = {
      address: location.address,
      postalCode: location.postal_code,
      type: location.type,
    };

    if (location.country) {
      locationData.country = {
        name: location.country.name,
        code: location.country.code,
        iconUrl: location.country.icon_url,
      };
    }

    if (location.department) {
      locationData.department = {
        departmentId: location.department.department_id || location.department.id,
        name: location.department.name,
      };
    }

    if (location.city) {
      locationData.city = {
        cityId: location.city.city_id || location.city.id,
        name: location.city.name,
      };
    }

    return locationData;
  }

  /**
   * Builder de tokens
   */
  static buildTokens(tokens) {
    if (!tokens) return null;

    return {
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }

  /**
   * Builder de usuario completo (user + person + role + avatar)
   * Usado en: LoginResponseDTO, BasicProfileDTO
   */
  static buildUserComplete(user) {
    if (!user) return null;

    const userData = this.buildUserBasic(user);

    if (user.person) {
      userData.person = this.buildPersonBasic(user.person);

      // Agregar género si existe
      if (user.person.gender) {
        userData.person.gender = this.buildGender(user.person.gender);
      }

      // Agregar país si existe
      if (user.person.country) {
        userData.person.country = this.buildCountry(user.person.country);
      }

      // Agregar contacto si existe
      if (user.person.contact) {
        userData.contact = this.buildContact(user.person.contact);
      }
    }

    if (user.role) {
      userData.role = this.buildRole(user.role);
    }

    if (user.avatar) {
      userData.avatar = this.buildAvatarWithTheme(user.avatar);
    }

    return userData;
  }

  /**
   * Builder de usuario extendido (con ubicación)
   */
  static buildUserExtended(user) {
    const userData = this.buildUserComplete(user);

    if (user.person?.location) {
      userData.location = this.buildLocation(user.person.location);
    }

    return userData;
  }
}

/**
 * Builder para metadata de paginación
 */
class PaginationDTO {
  constructor(data) {
    this.currentPage = data.currentPage;
    this.pageSize = data.pageSize;
    this.totalItems = data.totalItems;
    this.totalPages = data.totalPages;
    this.hasNextPage = data.hasNextPage;
    this.hasPreviousPage = data.hasPreviousPage;
  }
}

class SortDTO {
  constructor(data) {
    this.field = data.field;
    this.order = data.order;
  }
}

class MetadataDTO {
  constructor(data) {
    this.pagination = new PaginationDTO(data.pagination);
    this.sort = new SortDTO(data.sort);
    if (data.filters && Object.keys(data.filters).length > 0) {
      this.filters = data.filters;
    }
  }
}

module.exports = {
  UserBaseDTO,
  PaginationDTO,
  SortDTO,
  MetadataDTO,
};