'use strict';

const { UserBaseDTO } = require('./base.dto');

/**
 * DTO para perfil básico
 */
class BasicProfileDTO {
  constructor(user) {
    // ✅ Reutilizar builder completo
    Object.assign(this, UserBaseDTO.buildUserComplete(user));
  }
}

/**
 * DTO para perfil extendido
 */
class ExtendedProfileDTO {
  constructor(user) {
    // ✅ Reutilizar builder extendido (incluye ubicación)
    Object.assign(this, UserBaseDTO.buildUserExtended(user));
  }
}

/**
 * DTO para ubicación
 */
class LocationDTO {
  constructor(location) {
    if (!location) {
      this.location = null;
      return;
    }
    
    // ✅ Reutilizar builder de ubicación
    this.location = UserBaseDTO.buildLocation(location);
  }
}

/**
 * DTO para información de contacto
 */
class ContactInfoResponseDTO {
  constructor(contactInfo) {
    this.personContactId = contactInfo.person_contact_id || contactInfo.id;
    this.personId = contactInfo.person_id;
    
    this.email = {
      address: contactInfo.email,
      verified: !!contactInfo.email_verified_at,
      verifiedAt: contactInfo.email_verified_at
    };

    this.phonePrimary = this._buildPhoneInfo(
      contactInfo.phone_primary,
      contactInfo.phone_primary_verified_at,
      contactInfo.phone_primary_prefix
    );

    this.phoneSecondary = this._buildPhoneInfo(
      contactInfo.phone_secondary,
      contactInfo.phone_secondary_verified_at,
      contactInfo.phone_secondary_prefix
    );

    this.createdAt = contactInfo.created_at || contactInfo.createdAt;
    this.updatedAt = contactInfo.updated_at || contactInfo.updatedAt;
  }

  _buildPhoneInfo(phoneNumber, verifiedAt, prefixData) {
    if (!phoneNumber) return null;

    const phoneInfo = {
      number: phoneNumber,
      verified: !!verifiedAt,
      verifiedAt: verifiedAt
    };

    if (prefixData) {
      phoneInfo.prefix = {
        id: prefixData.phone_prefix_id || prefixData.id,
        prefix: prefixData.prefix
      };
    }

    return phoneInfo;
  }
}

/**
 * DTO para respuesta de actualización de email
 */
class UpdateEmailResponseDTO {
  constructor(email, verifiedAt) {
    this.email = email;
    this.emailVerifiedAt = verifiedAt;
  }
}

/**
 * DTO para respuesta de actualización de teléfono
 */
class UpdatePhoneResponseDTO {
  constructor(phone, phonePrefixId, phoneType, verifiedAt) {
    this.phone = phone;
    this.phonePrefixId = phonePrefixId;
    this.phoneType = phoneType;
    this.verifiedAt = verifiedAt;
  }
}

/**
 * DTO para respuesta de actualización de avatar
 */
class UpdateAvatarResponseDTO {
  constructor(avatar) {
    // ✅ Reutilizar builder de avatar
    this.avatar = UserBaseDTO.buildAvatarWithTheme(avatar);
  }
}

/**
 * DTO para respuesta de cambio de national ID
 */
class ChangeNationalIdResponseDto {
  constructor(user, oldNationalId, newNationalId) {
    this.userId = user.user_id || user.id;
    this.username = user.username;
    this.oldNationalId = oldNationalId;
    this.newNationalId = newNationalId;
  }
}

module.exports = {
  BasicProfileDTO,
  ExtendedProfileDTO,
  LocationDTO,
  UpdateEmailResponseDTO,
  UpdatePhoneResponseDTO,
  UpdateAvatarResponseDTO,
  ContactInfoResponseDTO,
  ChangeNationalIdResponseDto,
};