'use strict';

const {
  UserComponent,
  PersonComponent,
  ContactComponent,
  TrustedDeviceComponent,
} = require('../../../../shared/dtos/components.dto');

/**
 * Auth Login DTOs
 * Cubre: login, verifyMFA, refreshToken, logout, sesiones, dispositivos
 */

class LoginResponseDTO {
  constructor({ user, tokens }) {
    this.user = UserComponent.build(user, { includeRole: true, includeAvatar: true });

    // Capas separadas — cada componente es su propia fuente de verdad
    if (user.person) {
      this.person = PersonComponent.build(user.person);

      if (user.person.contact) {
        this.contact = ContactComponent.build(user.person.contact);
      }
    }

    this.tokens = {
      accessToken:  tokens.accessToken,
      idToken:      tokens.idToken,
      refreshToken: tokens.refreshToken,
      expiresIn:    tokens.expiresIn,
    };
  }
}

class MFARequiredResponseDTO {
  constructor({ username, session, challengeType }) {
    this.requiresMFA   = true;
    this.challengeType = challengeType;
    this.username      = username;
    this.session       = session;
  }
}

class RefreshTokenResponseDTO {
  constructor({ accessToken, idToken, expiresIn }) {
    this.accessToken = accessToken;
    this.idToken     = idToken;
    this.expiresIn   = expiresIn;
  }
}

// ─── Trusted Devices ────────────────────────────────────────────────────────
// Usa TrustedDeviceComponent del shared — no duplicar lógica aquí.

class TrustedDeviceListDTO {
  constructor(devices, currentFingerprintHash = null) {
    this.devices = TrustedDeviceComponent.buildArray(devices, currentFingerprintHash);
    this.total   = this.devices.length;
  }
}

class TrustedDeviceUpdateDTO {
  constructor(device) {
    this.id         = device.id;
    this.deviceName = device.device_name;
    this.updatedAt  = device.updated_at;
  }
}

module.exports = {
  LoginResponseDTO,
  MFARequiredResponseDTO,
  RefreshTokenResponseDTO,
  TrustedDeviceListDTO,
  TrustedDeviceUpdateDTO,
};