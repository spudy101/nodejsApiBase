'use strict';

/**
 * DTO para respuesta de configuración de TOTP
 * Usado en: setupTOTP()
 */
class TOTPSetupResponseDTO {
  constructor({ otpauthUrl, secretCode, username }) {
    this.data = {
      otpauthUrl,
      secretCode,
      username,
      instructions: 'Escanea el código QR con tu aplicación de autenticación (Google Authenticator, Authy, etc.) y verifica el código generado para activar TOTP.',
    };
  }
}

/**
 * DTO para respuesta de activación/desactivación de TOTP
 * Usado en: verifyAndActivateTOTP(), deactivateTOTP()
 */
class TOTPActivationResponseDTO {
  constructor({ userId, username, totpEnabled }) {
    this.data = {
      userId,
      username,
      totpEnabled,
    };
  }
}

/**
 * DTO para respuesta de verificación de TOTP
 * Usado en: verifyTOTP()
 */
class TOTPVerificationResponseDTO {
  constructor({ valid, username }) {
    this.data = {
      valid,
      username,
    };
  }
}

/**
 * DTO para respuesta de validación de contraseña
 * Usado en: validatePassword()
 */
class PasswordValidationResponseDTO {
  constructor({ valid, username }) {
    this.data = {
      valid,
      username,
    };
  }
}

module.exports = {
  TOTPSetupResponseDTO,
  TOTPActivationResponseDTO,
  TOTPVerificationResponseDTO,
  PasswordValidationResponseDTO,
};