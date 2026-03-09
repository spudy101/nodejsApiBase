'use strict';

/**
 * MFA DTOs
 * Cubre: setupTOTP, verifyAndActivateTOTP, verifyTOTP, deactivateTOTP, validatePassword
 */

class TOTPSetupResponseDTO {
  constructor({ otpauthUrl, secretCode, username }) {
    this.otpauthUrl = otpauthUrl;
    this.secretCode = secretCode;
    this.username   = username;
  }
}

class TOTPActivationResponseDTO {
  constructor({ userId, username, totpEnabled }) {
    this.userId      = userId;
    this.username    = username;
    this.totpEnabled = totpEnabled;
    this.updatedAt   = new Date();
  }
}

class TOTPVerificationResponseDTO {
  constructor({ valid, username }) {
    this.valid    = valid;
    this.username = username;
  }
}

class PasswordValidationResponseDTO {
  constructor({ valid, username }) {
    this.valid    = valid;
    this.username = username;
  }
}

module.exports = {
  TOTPSetupResponseDTO,
  TOTPActivationResponseDTO,
  TOTPVerificationResponseDTO,
  PasswordValidationResponseDTO,
};
