'use strict';

const { UserBaseDTO, MetadataDTO } = require('./base.dto');

/**
 * DTO para usuario completo (usado en getById)
 */
class UserDto {
  constructor(user) {
    this.userId = user.user_id || user.id;
    this.username = user.username;
    this.isActive = user.is_active;
    this.totpEnabled = user.totp_enabled;
    this.createdAt = user.created_at || user.createdAt;
    this.updatedAt = user.updated_at || user.updatedAt;

    // ✅ Reutilizar builders
    if (user.person) {
      this.person = UserBaseDTO.buildPersonBasic(user.person);

      if (user.person.contact) {
        this.person.contact = this._buildContactSummary(user.person.contact);
      }

      if (user.person.gender) {
        this.person.gender = UserBaseDTO.buildGender(user.person.gender);
      }

      if (user.person.country) {
        this.person.country = UserBaseDTO.buildCountry(user.person.country);
      }

      if (user.person.location) {
        this.person.location = UserBaseDTO.buildLocation(user.person.location);
      }
    }

    if (user.role) {
      this.role = UserBaseDTO.buildRole(user.role);
    }

    if (user.avatar) {
      this.avatar = UserBaseDTO.buildAvatarWithTheme(user.avatar);
    }
  }

  _buildContactSummary(contact) {
    return {
      email: contact.email,
      emailVerifiedAt: contact.email_verified_at,
      phonePrimary: contact.phone_primary,
      phonePrimaryVerifiedAt: contact.phone_primary_verified_at,
    };
  }
}

/**
 * DTO para item de lista de usuarios
 */
class UserListItemDto {
  constructor(user) {
    this.userId = user.user_id || user.id;
    this.username = user.username;
    this.isActive = user.is_active;
    this.totpEnabled = user.totp_enabled;
    this.createdAt = user.created_at || user.createdAt;

    if (user.person) {
      this.person = {
        firstName: user.person.first_name,
        lastName: user.person.last_name,
        nationalId: user.person.national_id,
      };

      if (user.person.contact) {
        this.email = user.person.contact.email;
        this.emailVerified = !!user.person.contact.email_verified_at;
      }
    }

    if (user.role) {
      this.role = {
        roleId: user.role.role_id || user.role.id,
        name: user.role.name,
      };
    }
  }
}

/**
 * DTO para crear usuario (con contraseña temporal)
 */
class CreateUserDto {
  constructor(user, temporaryPassword) {
    this.user = new UserDto(user);
    this.temporaryPassword = temporaryPassword;
  }
}

/**
 * DTO para reset de password
 */
class ResetPasswordDto {
  constructor(user) {
    this.userId = user.user_id || user.id;
    this.username = user.username;
    this.email = user.person?.contact?.email;
  }
}

/**
 * DTO para cambio de email
 */
class ChangeEmailDto {
  constructor(user, oldEmail, newEmail) {
    this.userId = user.user_id || user.id;
    this.username = user.username;
    this.oldEmail = oldEmail;
    this.newEmail = newEmail;
    this.emailVerified = true;
  }
}

/**
 * DTO para cambio de national ID
 */
class ChangeNationalIdDto {
  constructor(user, oldNationalId, newNationalId) {
    this.userId = user.user_id || user.id;
    this.username = user.username;
    this.oldNationalId = oldNationalId;
    this.newNationalId = newNationalId;
  }
}

/**
 * DTO para activar/desactivar usuario
 */
class ToggleUserStatusDto {
  constructor(user, action) {
    this.userId = user.user_id || user.id;
    this.username = user.username;
    this.isActive = user.is_active;
    this.action = action; // 'activate' | 'deactivate'
  }
}

/**
 * DTO para deshabilitar MFA
 */
class DisableMFADto {
  constructor(user) {
    this.userId = user.user_id || user.id;
    this.username = user.username;
    this.totpEnabled = user.totp_enabled;
  }
}

/**
 * DTO para cambio de rol
 */
class ChangeRoleDto {
  constructor(user, oldRole, newRole) {
    this.userId = user.user_id || user.id;
    this.username = user.username;
    this.oldRole = {
      roleId: oldRole.role_id || oldRole.id,
      name: oldRole.name,
    };
    this.newRole = {
      roleId: newRole.role_id || newRole.id,
      name: newRole.name,
    };
  }
}

module.exports = {
  MetadataDTO,
  UserDto,
  UserListItemDto,
  CreateUserDto,
  ResetPasswordDto,
  ChangeEmailDto,
  ChangeNationalIdDto,
  ToggleUserStatusDto,
  DisableMFADto,
  ChangeRoleDto,
};