'use strict';

const {
  UserComponent,
  PersonComponent,
  ContactComponent,
} = require('../../../../shared/dtos/components.dto');

/**
 * Auth Register DTOs
 * Cubre: register, requestResetCredentials, confirmResetCredentials
 */

class RegisterResponseDTO {
  constructor({ user, person, personContact, tokens }) {
    this.user    = UserComponent.build(user, { includeRole: true, includeAvatar: true });
    this.person  = PersonComponent.build(person);
    this.contact = ContactComponent.build(personContact);

    this.tokens = {
      accessToken:  tokens.accessToken,
      idToken:      tokens.idToken,
      refreshToken: tokens.refreshToken,
      expiresIn:    tokens.expiresIn,
    };
  }
}

module.exports = {
  RegisterResponseDTO,
};