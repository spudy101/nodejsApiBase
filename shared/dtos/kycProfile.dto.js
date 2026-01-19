class BasicProfileDTO {
  constructor(user) {
    this.userId = user.user_id;
    this.username = user.username;
    this.isActive = user.is_active;
    this.mfaEnabled = user.totp_enabled || false;

    if (user.person) {
      this.person = {
        personId: user.person.person_id,
        firstName: user.person.first_name,
        lastName: user.person.last_name,
        nationalId: user.person.national_id,
        birthDate: user.person.birth_date,
        genderId: user.person.gender_id,
        countryId: user.person.country_id,
      };
    }

    if (user.role) {
      this.role = {
        roleId: user.role.role_id,
        name: user.role.name,
        description: user.role.description,
      };
    }

    if (user.avatar) {
      this.avatar = {
        avatarId: user.avatar.avatar_id,
        url: user.avatar.url,
      };
    }
  }
}

class ExtendedProfileDTO extends BasicProfileDTO {
  constructor(user) {
    super(user);
    
    if (!user.person) return;

    this._buildLocation(user.person.location);
    this._buildContact(user.person.contact);
    this._buildGender(user.person.gender);
    this._buildSocialNetworks(user.person.socialNetworks);
    this._buildCountry(user.person.country);
  }

  _buildLocation(location) {
    if (!location) return;

    this.location = {
      address: location.address,
      postalCode: location.postal_code,
      type: location.type,
    };
    
    if (location.country) {
      this.location.country = {
        name: location.country.name,
        code: location.country.code,
        url: location.country.icon_url
      };
    }

    if (location.department) {
      this.location.department = {
        name: location.department.name
      };
    }

    if (location.city) {
      this.location.city = {
        name: location.city.name
      };
    }
  }

  _buildContact(contact) {
    if (!contact) return;

    this.contact = {
      email: contact.email,
      emailVerifiedAt: contact.email_verified_at,
      phonePrimary: contact.phone_primary,
      phonePrimaryVerifiedAt: contact.phone_primary_verified_at,
      phoneSecondary: contact.phone_secondary,
      phoneSecondaryVerifiedAt: contact.phone_secondary_verified_at,
      phonePrimaryPrefix: contact.phone_primary_prefix?.prefix || null,
      phoneSecondaryPrefix: contact.phone_secondary_prefix?.prefix || null
    };
  }

  _buildGender(gender) {
    if (!gender) return;

    this.gender = {
      name: gender.name,
    };
  }

  _buildSocialNetworks(socialNetworks) {
    if (!socialNetworks?.length) return;

    this.socialNetworks = socialNetworks.map((socialNetwork) => {
      const network = {
        username_handle: socialNetwork.username_handle,
        profile_url: socialNetwork.profile_url,
        is_verified: socialNetwork.is_verified,
      };

      if (socialNetwork.provider) {
        network.provider = {
          name: socialNetwork.provider.name,
          icon_url: socialNetwork.provider.icon_url,
          base_url: socialNetwork.provider.base_url
        };
      }

      return network;
    });
  }

  _buildCountry(country) {
    if (!country) return;

    this.country = {
      name: country.name,
      code: country.code,
      url: country.icon_url
    };
  }
}

class LocationDTO {
  constructor(location) {
    if (!location) return null;
    
      this.location = {
        address: location.address,
        postalCode: location.postal_code,
        type: location.type,
      };
      
      // country
      if (location.country) {
        this.location.country = {
          name: location.country.name,
          code: location.country.code,
          url: location.country.icon_url
        };
      }

      // department
      if (location.department) {
        this.location.department = {
          name: location.department.name
        };
      }

      // city
      if (location.city) {
        this.location.city = {
          name: location.city.name
        };
      }
  }
}

class UpdateEmailResponseDTO {
  constructor(email, verified_at) {
    this.email = email;
    this.email_verified_at = verified_at;
  }
}

class UpdateAvatarResponseDTO {
  constructor(avatar) {
    this.avatar_id = avatar.avatar_id;
    this.avatar = {
      avatar_id: avatar.avatar_id,
      name: avatar.name,
      image_url: avatar.image_url,
      // TODO: Agregar más columnas de Avatar model
    };
  }
}

class UpdatePhoneResponseDTO {
  constructor(phone, phonePrefixId, phoneType, verifiedAt) {
    this.phone = phone;
    this.phone_prefix_id = phonePrefixId;
    this.phone_type = phoneType; // 'primary' o 'secondary'
    this.verified_at = verifiedAt;
  }
}

class ContactInfoResponseDTO {
  constructor(contactInfo) {
    this.person_contact_id = contactInfo.person_contact_id;
    this.person_id = contactInfo.person_id;
    
    // Email
    this.email = {
      address: contactInfo.email,
      verified: !!contactInfo.email_verified_at,
      verified_at: contactInfo.email_verified_at
    };

    // Phone Primary
    this.phone_primary = this._buildPhoneInfo(
      contactInfo.phone_primary,
      contactInfo.phone_primary_verified_at,
      contactInfo.phone_primary_prefix
    );

    // Phone Secondary
    this.phone_secondary = this._buildPhoneInfo(
      contactInfo.phone_secondary,
      contactInfo.phone_secondary_verified_at,
      contactInfo.phone_secondary_prefix
    );

    this.created_at = contactInfo.createdAt;
    this.updated_at = contactInfo.updatedAt;
  }

  _buildPhoneInfo(phoneNumber, verifiedAt, prefixData) {
    if (!phoneNumber) return null;

    const phoneInfo = {
      number: phoneNumber,
      verified: !!verifiedAt,
      verified_at: verifiedAt
    };

    // Solo agregar prefix si existe la data completa
    if (prefixData?.phone_prefix_id) {
      phoneInfo.prefix = {
        id: prefixData.phone_prefix_id,
        prefix: prefixData.prefix
      };
    }

    return phoneInfo;
  }
}

/**
 * DTO para respuesta de cambio de national_id
 */
class ChangeNationalIdResponseDto {
  constructor(user, oldNationalId, newNationalId) {
    this.data = {
      user_id: user.user_id,
      username: user.username,
      old_national_id: oldNationalId,
      new_national_id: newNationalId,
    };
    this.message = 'Identificación nacional actualizada exitosamente.';
  }
}

/**
 * DTO para respuesta de eliminación de cuenta (cliente)
 */
class DeleteAccountResponseDto {
  constructor(user, deletedAt) {
    this.data = {
      user_id: user.user_id,
      username: user.username,
      first_name: user.person?.first_name,
      last_name: user.person?.last_name,
      deleted_at: deletedAt
    };
    this.message = 'Cuenta eliminada exitosamente. Esperamos verte pronto.';
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
  DeleteAccountResponseDto
};