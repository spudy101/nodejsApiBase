'use strict';

/**
 * ============================================================
 * SHARED COMPONENTS DTO
 * ============================================================
 * Bloques reutilizables para construir DTOs en todo el módulo kyc.
 * Usado tanto en client como en admin — nunca duplicar estos bloques.
 *
 * Convención de IDs: todos los modelos usan `id` como PK.
 * Convención de asociaciones: respetar los alias definidos en cada modelo.
 *   person.contact       (PersonContact)
 *   person.location      (PersonLocation)
 *   person.user          (User)
 *   person.gender        (Gender)
 *   person.nationality   (Country)
 *   contact.primaryPrefix   (PhonePrefix)
 *   contact.secondaryPrefix (PhonePrefix)
 *   location.country     (Country)
 *   location.department  (Department)
 *   location.city        (City)
 *   user.role            (Role)
 *   user.avatar          (Avatar)
 *   user.trustedDevices  (UserTrustedDevice[])
 */

// ============================================================
// BASE COMPONENTS
// ============================================================

class PersonComponent {
  /**
   * @param {Object} person - Instancia de Person
   * @param {boolean} includeExtras - Incluir gender y nationality
   */
  static build(person, includeExtras = false) {
    if (!person) return null;

    const dto = {
      id:             person.id,
      firstName:      person.first_name,
      lastName:       person.last_name,
      middleName:     person.middle_name || null,
      secondLastName: person.second_last_name || null,
      fullName:       [person.first_name, person.middle_name, person.last_name, person.second_last_name]
                        .filter(Boolean).join(' '),
      nationalId:     person.national_id,
      birthDate:      person.birth_date,
      genderId:       person.gender_id,
      countryId:      person.country_id,
    };

    if (includeExtras) {
      if (person.gender)       dto.gender      = GenderComponent.build(person.gender);
      if (person.nationality)  dto.nationality = CountryComponent.build(person.nationality);
    }

    return dto;
  }
}

class ContactComponent {
  /**
   * @param {Object} contact - Instancia de PersonContact
   * Alias de prefijos: primaryPrefix / secondaryPrefix
   */
  static build(contact) {
    if (!contact) return null;

    const primaryPrefix   = contact.primaryPrefix?.prefix   || null;
    const secondaryPrefix = contact.secondaryPrefix?.prefix || null;

    return {
      id:                       contact.id,
      email:                    contact.email,
      emailVerifiedAt:          contact.email_verified_at,
      isEmailVerified:          !!contact.email_verified_at,

      phonePrimary:             contact.phone_primary || null,
      phonePrimaryPrefixId:     contact.phone_primary_prefix_id || null,
      phonePrimaryPrefix:       primaryPrefix,
      phonePrimaryFull:         contact.phone_primary
                                  ? `${primaryPrefix || ''}${contact.phone_primary}`
                                  : null,
      phonePrimaryVerifiedAt:   contact.phone_primary_verified_at,
      isPhonePrimaryVerified:   !!contact.phone_primary_verified_at,

      phoneSecondary:           contact.phone_secondary || null,
      phoneSecondaryPrefixId:   contact.phone_secondary_prefix_id || null,
      phoneSecondaryPrefix:     secondaryPrefix,
      phoneSecondaryFull:       contact.phone_secondary
                                  ? `${secondaryPrefix || ''}${contact.phone_secondary}`
                                  : null,
      phoneSecondaryVerifiedAt: contact.phone_secondary_verified_at,
      isPhoneSecondaryVerified: !!contact.phone_secondary_verified_at,
    };
  }
}

class LocationComponent {
  /**
   * @param {Object} location - Instancia de PersonLocation
   * Aliases: country, department, city
   */
  static build(location) {
    if (!location) return null;

    const dto = {
      id:           location.id,
      address:      location.address,
      postalCode:   location.postal_code || null,
      type:         location.type || null,
      countryId:    location.country_id,
      departmentId: location.department_id,
      cityId:       location.city_id,
    };

    if (location.country)    dto.country    = CountryComponent.build(location.country);
    if (location.department) dto.department = { id: location.department.id, name: location.department.name };
    if (location.city)       dto.city       = { id: location.city.id, name: location.city.name };

    return dto;
  }
}

class GenderComponent {
  static build(gender) {
    if (!gender) return null;
    return { id: gender.id, name: gender.name };
  }
}

class CountryComponent {
  static build(country) {
    if (!country) return null;
    return {
      id:      country.id,
      name:    country.name,
      code:    country.code,
      iconUrl: country.icon_url || null,
    };
  }
}

class RoleComponent {
  static build(role) {
    if (!role) return null;
    return {
      id:          role.id,
      name:        role.name,
      description: role.description || null,
    };
  }
}

class AvatarComponent {
  static build(avatar) {
    if (!avatar) return null;
    return {
      id:       avatar.id,
      name:     avatar.name,
      imageUrl: avatar.image_url || null,
      theme:    avatar.theme ? { id: avatar.theme.id, name: avatar.theme.name } : null,
    };
  }
}

class TrustedDeviceComponent {
  /**
   * @param {Object} device - Instancia de UserTrustedDevice
   * @param {string|null} currentFingerprintHash - Para marcar isCurrent
   */
  static build(device, currentFingerprintHash = null) {
    if (!device) return null;
    return {
      id:              device.id,
      deviceName:      device.device_name,
      fingerprintHash: device.fingerprint_hash,
      trustedAt:       device.trusted_at,
      lastSeenAt:      device.last_seen_at,
      isCurrent:       currentFingerprintHash
                         ? device.fingerprint_hash === currentFingerprintHash
                         : null,
    };
  }

  static buildArray(devices, currentFingerprintHash = null) {
    if (!devices || devices.length === 0) return [];
    return devices.map(d => TrustedDeviceComponent.build(d, currentFingerprintHash));
  }
}

class UserComponent {
  /**
   * @param {Object} user                           - Instancia de User
   * @param {Object} [options]
   * @param {boolean} [options.includeRole]         - Incluir asociación role
   * @param {boolean} [options.includeAvatar]       - Incluir asociación avatar
   * @param {boolean} [options.includeCognito]      - Incluir campos cognito_sub / cognito_username
   * @param {string|null} [options.fingerprintHash] - Para marcar isCurrent en trustedDevices
   *
   * Aliases esperados:
   *   user.role           (Role)
   *   user.avatar         (Avatar  → avatar.theme)
   *   user.trustedDevices (UserTrustedDevice[])
   */
  static build(user, options = {}) {
    if (!user) return null;

    const {
      includeRole     = false,
      includeAvatar   = false,
      includeCognito  = false,
      fingerprintHash = null,
    } = options;

    const dto = {
      id:           user.id,
      username:     user.username,
      isActive:     user.is_active,
      totpEnabled:  user.totp_enabled,
      roleId:       user.role_id,
      avatarId:     user.avatar_id || null,
      createdAt:    user.created_at,
    };

    if (includeCognito) {
      dto.cognitoSub      = user.cognito_sub      || null;
      dto.cognitoUsername = user.cognito_username || null;
    }

    if (includeRole   && user.role)   dto.role   = RoleComponent.build(user.role);
    if (includeAvatar && user.avatar) dto.avatar = AvatarComponent.build(user.avatar);

    if (user.trustedDevices?.length) {
      dto.trustedDevices = TrustedDeviceComponent.buildArray(user.trustedDevices, fingerprintHash);
    }

    return dto;
  }
}

// ============================================================
// PAGINATION DTOs — reutilizables en cualquier respuesta paginada
// ============================================================

class PaginationDTO {
  constructor(data) {
    this.currentPage     = data.currentPage;
    this.pageSize        = data.pageSize;
    this.totalItems      = data.totalItems;
    this.totalPages      = data.totalPages;
    this.hasNextPage     = data.hasNextPage;
    this.hasPreviousPage = data.hasPreviousPage;
  }
}

class SortDTO {
  constructor(data) {
    this.field = data.field;
    this.order = data.order;
  }
}

/**
 * Metadata completa para respuestas paginadas.
 * Uso:
 *   const meta = MetadataDTO.build({
 *     totalItems: count,
 *     page, limit,
 *     sortBy: 'created_at', order: 'DESC',
 *     filters: { isActive: true },
 *   });
 */
class MetadataDTO {
  constructor(data) {
    const totalPages = Math.ceil(data.totalItems / data.pageSize);

    this.pagination = new PaginationDTO({
      currentPage:     data.page,
      pageSize:        data.limit,
      totalItems:      data.totalItems,
      totalPages,
      hasNextPage:     data.page < totalPages,
      hasPreviousPage: data.page > 1,
    });

    this.sort = new SortDTO({
      field: data.sortBy || 'created_at',
      order: data.order  || 'DESC',
    });

    if (data.filters && Object.keys(data.filters).length > 0) {
      this.filters = data.filters;
    }
  }

  /**
   * Factory — atajo para construir desde los params de paginación
   * @param {{ totalItems, page, limit, sortBy, order, filters }} params
   */
  static build(params) {
    return new MetadataDTO(params);
  }
}

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  // Base components
  PersonComponent,
  ContactComponent,
  LocationComponent,
  GenderComponent,
  CountryComponent,
  RoleComponent,
  AvatarComponent,
  TrustedDeviceComponent,
  UserComponent,

  // Pagination
  PaginationDTO,
  SortDTO,
  MetadataDTO,
};