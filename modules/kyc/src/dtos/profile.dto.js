'use strict';

const {
  UserComponent,
  PersonComponent,
  ContactComponent,
  LocationComponent,
} = require('../../../../shared/dtos/components.dto');

/**
 * Profile DTOs
 * Cubre: getProfile (basic), getFullProfile, updateProfile,
 *        updateEmail, updatePhone, updatePassword, updateNationalId, deleteAccount
 */

// ============================================================
// GET
// ============================================================

class BasicProfileDTO {
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

class FullProfileDTO {
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
// UPDATE RESPONSES
// ============================================================

class UpdateEmailResponseDTO {
  constructor(newEmail, updatedAt) {
    this.email     = newEmail;
    this.updatedAt = updatedAt;
  }
}

class UpdatePhoneResponseDTO {
  constructor({ phone, phonePrefixId, phoneType, updatedAt }) {
    this.phone         = phone;
    this.phonePrefixId = phonePrefixId;
    this.phoneType     = phoneType;
    this.updatedAt     = updatedAt;
  }
}

class UpdateNationalIdResponseDTO {
  constructor({ user, oldNationalId, newNationalId }) {
    this.oldNationalId = oldNationalId;
    this.newNationalId = newNationalId;
    this.updatedAt     = new Date();

    if (user.person) {
      this.person = PersonComponent.build(user.person);
    }
  }
}

module.exports = {
  BasicProfileDTO,
  FullProfileDTO,
  UpdateEmailResponseDTO,
  UpdatePhoneResponseDTO,
  UpdateNationalIdResponseDTO,
};