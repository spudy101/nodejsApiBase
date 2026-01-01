// src/repository/loginAttempts.repository.js
const BaseRepository = require('./base.repository');
const db = require('../models');
const { LOGIN_ATTEMPTS } = require('../constants');

class LoginAttemptsRepository extends BaseRepository {
  constructor() {
    super(db.LoginAttempts);
  }

  /**
   * Find by email
   */
  async findByEmail(email) {
    return await this.findOne({ email });
  }

  /**
   * Increment attempts
   */
  async incrementAttempts(email, ipAddress) {
    let attempt = await this.findByEmail(email);

    if (!attempt) {
      attempt = await this.create({
        email,
        ipAddress,
        attempts: 1
      });
    } else {
      attempt.attempts += 1;
      attempt.ipAddress = ipAddress;

      // Block if max attempts reached
      if (attempt.attempts >= LOGIN_ATTEMPTS.MAX_ATTEMPTS) {
        attempt.blockedUntil = new Date(Date.now() + LOGIN_ATTEMPTS.BLOCK_DURATION_MS);
      }

      await attempt.save();
    }

    return attempt;
  }

  /**
   * Reset attempts
   */
  async resetAttempts(email) {
    const attempt = await this.findByEmail(email);
    
    if (attempt) {
      await attempt.destroy();
    }
  }

  /**
   * Check if blocked
   */
  async isBlocked(email) {
    const attempt = await this.findByEmail(email);

    if (!attempt) {
      return false;
    }

    if (attempt.blockedUntil && attempt.blockedUntil > new Date()) {
      return true;
    }

    // If block expired, reset attempts
    if (attempt.blockedUntil && attempt.blockedUntil <= new Date()) {
      await this.resetAttempts(email);
      return false;
    }

    return false;
  }

  /**
   * Get remaining time for block
   */
  async getRemainingBlockTime(email) {
    const attempt = await this.findByEmail(email);

    if (!attempt || !attempt.blockedUntil) {
      return 0;
    }

    const remaining = attempt.blockedUntil.getTime() - Date.now();
    return Math.max(0, Math.ceil(remaining / 1000)); // seconds
  }

  /**
   * Clean old attempts
   */
  async cleanOldAttempts() {
    const threshold = new Date(Date.now() - LOGIN_ATTEMPTS.RESET_AFTER_MS);
    
    return await this.model.destroy({
      where: {
        createdAt: { [db.Sequelize.Op.lt]: threshold },
        blockedUntil: { [db.Sequelize.Op.or]: [null, { [db.Sequelize.Op.lt]: new Date() }] }
      }
    });
  }
}

module.exports = new LoginAttemptsRepository();