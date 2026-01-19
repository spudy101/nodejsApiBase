'use strict';

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

class SortDto {
  constructor(data) {
    this.field = data.field;
    this.order = data.order;
  }
}

class MetadataDto {
  constructor(data) {
    this.pagination = new PaginationDto(data.pagination);
    this.sort = new SortDto(data.sort);
    if (data.filters && Object.keys(data.filters).length > 0) {
      this.filters = data.filters;
    }
  }
}

class UserDto {
  constructor(user) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.is_active = user.is_active;
    this.totp_enabled = user.totp_enabled;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;

    if (user.person) {
      this.person = {
        person_id: user.person.person_id,
        first_name: user.person.first_name,
        last_name: user.person.last_name,
        national_id: user.person.national_id,
        birth_date: user.person.birth_date,
      };

      if (user.person.contact) {
        this.person.contact = {
          email: user.person.contact.email,
          email_verified_at: user.person.contact.email_verified_at,
          phone_primary: user.person.contact.phone_primary,
          phone_primary_verified_at: user.person.contact.phone_primary_verified_at,
        };
      }

      if (user.person.gender) {
        this.person.gender = {
          gender_id: user.person.gender.gender_id,
          name: user.person.gender.name,
        };
      }

      if (user.person.country) {
        this.person.country = {
          country_id: user.person.country.country_id,
          name: user.person.country.name,
        };
      }
    }

    if (user.role) {
      this.role = {
        role_id: user.role.role_id,
        name: user.role.name,
        description: user.role.description,
      };
    }

    if (user.avatar) {
      this.avatar = {
        avatar_id: user.avatar.avatar_id,
        url: user.avatar.url,
      };
    }
  }
}

class UserListItemDto {
  constructor(user) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.is_active = user.is_active;
    this.totp_enabled = user.totp_enabled;
    this.createdAt = user.createdAt;

    if (user.person) {
      this.person = {
        first_name: user.person.first_name,
        last_name: user.person.last_name,
        national_id: user.person.national_id,
      };

      if (user.person.contact) {
        this.email = user.person.contact.email;
        this.email_verified = !!user.person.contact.email_verified_at;
      }
    }

    if (user.role) {
      this.role = {
        role_id: user.role.role_id,
        name: user.role.name,
      };
    }
  }
}

class CreateUserDto {
  constructor(user, temporaryPassword) {
    this.user = new UserDto(user);
    this.temporaryPassword = temporaryPassword;
  }
}

class ResetPasswordDto {
  constructor(user) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.email = user.person?.contact?.email;
  }
}

class ChangeEmailDto {
  constructor(user, oldEmail, newEmail) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.old_email = oldEmail;
    this.new_email = newEmail;
    this.email_verified = true;
  }
}

class ChangeNationalIdDto {
  constructor(user, oldNationalId, newNationalId) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.old_national_id = oldNationalId;
    this.new_national_id = newNationalId;
  }
}

class ToggleUserStatusDto {
  constructor(user, action) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.is_active = user.is_active;
  }
}

class DisableMFADto {
  constructor(user) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.totp_enabled = user.totp_enabled;
  }
}

class ChangeRoleDto {
  constructor(user, oldRole, newRole) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.old_role = {
      role_id: oldRole.role_id,
      name: oldRole.name,
    };
    this.new_role = {
      role_id: newRole.role_id,
      name: newRole.name,
    };
  }
}

module.exports = {
  PaginationDto,
  SortDto,
  MetadataDto,
  UserDto,
  UserListItemDto,
  CreateUserDto,
  ResetPasswordDto,
  ChangeEmailDto,
  ChangeNationalIdDto,
  ToggleUserStatusDto,
  DisableMFADto,
  ChangeRoleDto
};