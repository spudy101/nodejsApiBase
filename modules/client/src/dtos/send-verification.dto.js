'use strict';

/**
 * SendVerification DTOs
 * Cubre: sendVerificationCode, verifyCode
 */

class SendVerificationResponseDTO {
  constructor({ verificationCode }) {
    this.id        = verificationCode.id;
    this.type      = verificationCode.type;
    this.expiresAt = verificationCode.expires_at;
    this.createdAt = verificationCode.created_at;
  }
}

class VerifyCodeResponseDTO {
  constructor() {
    this.verified   = true;
    this.verifiedAt = new Date();
  }
}

module.exports = {
  SendVerificationResponseDTO,
  VerifyCodeResponseDTO,
};
