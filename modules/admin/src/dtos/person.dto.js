'use strict';

const {
  UserComponent,
  PersonComponent,
  ContactComponent,
  LocationComponent,
  RoleComponent,
  MetadataDTO,
} = require('../../../../shared/dtos/components.dto');

/**
 * Person DTOs — Admin
 * Cubre: list, getById, create, toggleStatus, resetPassword,
 *        changeEmail, changeNationalId, disableMFA, changeRole, deleteAccount
 */

// ============================================================
// LIST
// ============================================================

class UserListItemDTO {
  constructor(user) {
    this.user = UserComponent.build(user, { includeRole: true, includeAvatar: true });

    if (user.person) {
      this.person = PersonComponent.build(user.person);

      if (user.person.contact) {
        this.contact = ContactComponent.build(user.person.contact);
      }
    }
  }
}

// ============================================================
// GET BY ID
// ============================================================

class UserDTO {
  constructor(user) {
    this.user = UserComponent.build(user, { includeRole: true, includeAvatar: true });

    if (user.person) {
      this.person = PersonComponent.build(user.person, true); // includeExtras: gender + nationality

      if (user.person.contact)  this.contact  = ContactComponent.build(user.person.contact);
      if (user.person.location) this.location = LocationComponent.build(user.person.location);
    }
  }
}

// ============================================================
// CREATE
// ============================================================

class CreateUserDTO {
  constructor(user, temporaryPassword) {
    this.user              = UserComponent.build(user, { includeRole: true });
    this.temporaryPassword = temporaryPassword;

    if (user.person) {
      this.person = PersonComponent.build(user.person);

      if (user.person.contact) {
        this.contact = ContactComponent.build(user.person.contact);
      }
    }
  }
}

// ============================================================
// TOGGLE STATUS
// ============================================================

class ToggleUserStatusDTO {
  constructor(user, action) {
    this.id        = user.id;
    this.isActive  = user.is_active;
    this.action    = action;
    this.updatedAt = new Date();
  }
}

// ============================================================
// RESET PASSWORD
// ============================================================

class ResetPasswordDTO {
  constructor(user) {
    this.id        = user.id;
    this.updatedAt = new Date();

    if (user.person) {
      this.person = PersonComponent.build(user.person);
    }
  }
}

// ============================================================
// CHANGE EMAIL
// ============================================================

class ChangeEmailDTO {
  constructor(user, oldEmail, newEmail) {
    this.id        = user.id;
    this.oldEmail  = oldEmail;
    this.newEmail  = newEmail;
    this.updatedAt = new Date();
  }
}

// ============================================================
// CHANGE NATIONAL ID
// ============================================================

class ChangeNationalIdDTO {
  constructor(user, oldNationalId, newNationalId) {
    this.id            = user.id;
    this.oldNationalId = oldNationalId;
    this.newNationalId = newNationalId;
    this.updatedAt     = new Date();

    if (user.person) {
      this.person = PersonComponent.build(user.person);
    }
  }
}

// ============================================================
// DISABLE MFA
// ============================================================

class DisableMFADTO {
  constructor(user) {
    this.id          = user.id;
    this.totpEnabled = false;
    this.updatedAt   = new Date();
  }
}

// ============================================================
// CHANGE ROLE
// ============================================================

class ChangeRoleDTO {
  constructor(user, oldRole, newRole) {
    this.id        = user.id;
    this.oldRole   = RoleComponent.build(oldRole);
    this.newRole   = RoleComponent.build(newRole);
    this.updatedAt = new Date();
  }
}

module.exports = {
  UserListItemDTO,
  UserDTO,
  CreateUserDTO,
  ToggleUserStatusDTO,
  ResetPasswordDTO,
  ChangeEmailDTO,
  ChangeNationalIdDTO,
  DisableMFADTO,
  ChangeRoleDTO,
};