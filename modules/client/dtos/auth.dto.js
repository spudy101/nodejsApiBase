'use strict';

/**
 * DTO para respuesta de registro de usuario
 */
class RegisterResponseDTO {
  constructor({ user, person, personContact, tokens }) {
    this.user = {
      id: user.user_id,
      username: user.username,
      isActive: user.is_active,
      roleId: user.role_id,
      createdAt: user.created_at,
    };

    this.person = {
      id: person.person_id,
      firstName: person.first_name,
      lastName: person.last_name,
      nationalId: person.national_id,
      genderId: person.gender_id,
      countryId: person.country_id,
    };

    this.contact = {
      id: personContact.person_contact_id,
      email: personContact.email,
      emailVerifiedAt: personContact.email_verified_at,
    };

    this.tokens = {
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }
}

module.exports = {
  RegisterResponseDTO,
};