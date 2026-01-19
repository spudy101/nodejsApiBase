'use strict';

const BaseRepository = require('./base.repository');
const { VerificationCode } = require('../models');
const { Op, literal } = require('sequelize');

class VerificationCodeRepository extends BaseRepository {
  constructor() {
    super(VerificationCode);
  }

  static RATE_LIMIT_SECONDS = 60;

  async findActiveByContact(type, contactValue) {
    return await this.findOne(
      {
        type,
        contact_value: contactValue,
        expires_at: { [Op.gt]: new Date() },
        verified_at: null
      },
      { order: [['created_at', 'DESC']] }
    );
  }

  async findVerifiedByContact(type, contactValue) {
    return await this.findOne(
      {
        type,
        contact_value: contactValue,
        verified_at: { [Op.ne]: null }
      },
      { order: [['verified_at', 'DESC']] }
    );
  }

  async create(codeData, options = {}) {
    return await super.create({
      type: codeData.type,
      contact_value: codeData.contact_value,
      code: codeData.code,
      expires_at: codeData.expires_at,
      verified_at: null
    }, options);
  }

  async markAsVerified(verificationCodeId, verifiedAt = new Date(), options = {}) {
    return await this.update(verificationCodeId, { verified_at: verifiedAt }, options);
  }

  /**
   * Verifica rate limiting (1 código por minuto)
   */
  async canRequestNewCode(type, contactValue) {
    const threshold = new Date(Date.now() - VerificationCodeRepository.RATE_LIMIT_SECONDS * 1000);

    const recentCode = await this.findOne(
      {
        type,
        contact_value: contactValue,
        created_at: { [Op.gte]: threshold }
      },
      { order: [['created_at', 'DESC']] }
    );

    return !recentCode;
  }

  /**
   * Incrementa contador de intentos
   */
  async incrementAttempts(verificationCodeId) {
    const [affectedRows] = await this.model.update(
      { attempts: literal('attempts + 1') },
      {
        where: {
          verification_code_id: verificationCodeId,
          verified_at: null,
          expires_at: { [Op.gt]: new Date() }
        }
      }
    );

    return affectedRows;
  }

  // Override para usar verification_code_id
  async findById(verificationCodeId, options = {}) {
    return await this.model.findByPk(verificationCodeId, options);
  }
}

module.exports = new VerificationCodeRepository();