class SendVerificationResponseDTO {
  constructor({ verificationCode }) {
    this.codeId = verificationCode.verification_code_id;
    this.expiresAt = verificationCode.expires_at;
  }
}

class VerifyCodeResponseDTO {
  constructor() {
    this.verified = true;
  }
}

module.exports = {
  SendVerificationResponseDTO, 
  VerifyCodeResponseDTO
};