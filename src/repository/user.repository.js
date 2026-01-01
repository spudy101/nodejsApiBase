// src/repository/user.repository.js
const BaseRepository = require('./base.repository');
const db = require('../models');

class UserRepository extends BaseRepository {
  constructor() {
    super(db.User);
  }

  /**
   * Find user by email
   */
  async findByEmail(email) {
    return await this.findOne({ email });
  }

  /**
   * Find active user by email
   */
  async findActiveByEmail(email) {
    return await this.findOne({ email, isActive: true });
  }

  /**
   * Update last login
   */
  async updateLastLogin(userId) {
    return await this.update(userId, { lastLogin: new Date() });
  }

  /**
   * Get user profile with products
   */
  async getProfileWithProducts(userId) {
    return await this.findById(userId, {
      include: [
        {
          model: db.Product,
          as: 'creator',
          where: { isActive: true },
          required: false
        }
      ]
    });
  }

  /**
   * Check if email exists (excluding user ID)
   */
  async emailExistsExcluding(email, userId) {
    const count = await this.count({
      email,
      id: { [db.Sequelize.Op.ne]: userId }
    });
    return count > 0;
  }

  /**
   * Get users by role
   */
  async findByRole(role, options = {}) {
    return await this.findAll({ role }, options);
  }

  /**
   * Deactivate user
   */
  async deactivate(userId) {
    return await this.update(userId, { isActive: false });
  }

  /**
   * Activate user
   */
  async activate(userId) {
    return await this.update(userId, { isActive: true });
  }
}

module.exports = new UserRepository();