// src/repository/base.repository.js
const { logger } = require('../utils/logger');

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  /**
   * Find by primary key
   */
  async findById(id, options = {}) {
    try {
      return await this.model.findByPk(id, options);
    } catch (error) {
      logger.error(`Error finding ${this.model.name} by ID`, { id, error: error.message });
      throw error;
    }
  }

  /**
   * Find one by criteria
   */
  async findOne(criteria, options = {}) {
    try {
      return await this.model.findOne({ where: criteria, ...options });
    } catch (error) {
      logger.error(`Error finding one ${this.model.name}`, { criteria, error: error.message });
      throw error;
    }
  }

  /**
   * Find all by criteria
   */
  async findAll(criteria = {}, options = {}) {
    try {
      return await this.model.findAll({ where: criteria, ...options });
    } catch (error) {
      logger.error(`Error finding all ${this.model.name}`, { criteria, error: error.message });
      throw error;
    }
  }

  /**
   * Find with pagination
   */
  async findAndCountAll(criteria = {}, options = {}) {
    try {
      return await this.model.findAndCountAll({ where: criteria, ...options });
    } catch (error) {
      logger.error(`Error finding and counting ${this.model.name}`, { criteria, error: error.message });
      throw error;
    }
  }

  /**
   * Create new record
   */
  async create(data, options = {}) {
    try {
      return await this.model.create(data, options);
    } catch (error) {
      logger.error(`Error creating ${this.model.name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Update record
   */
  async update(id, data, options = {}) {
    try {
      const [updated] = await this.model.update(data, {
        where: { id },
        ...options
      });
      
      if (updated) {
        return await this.findById(id);
      }
      
      return null;
    } catch (error) {
      logger.error(`Error updating ${this.model.name}`, { id, error: error.message });
      throw error;
    }
  }

  /**
   * Delete record (soft delete if supported)
   */
  async delete(id, options = {}) {
    try {
      return await this.model.destroy({
        where: { id },
        ...options
      });
    } catch (error) {
      logger.error(`Error deleting ${this.model.name}`, { id, error: error.message });
      throw error;
    }
  }

  /**
   * Count records
   */
  async count(criteria = {}, options = {}) {
    try {
      return await this.model.count({ where: criteria, ...options });
    } catch (error) {
      logger.error(`Error counting ${this.model.name}`, { criteria, error: error.message });
      throw error;
    }
  }

  /**
   * Check if exists
   */
  async exists(criteria) {
    try {
      const count = await this.count(criteria);
      return count > 0;
    } catch (error) {
      logger.error(`Error checking existence ${this.model.name}`, { criteria, error: error.message });
      throw error;
    }
  }

  /**
   * Bulk create
   */
  async bulkCreate(data, options = {}) {
    try {
      return await this.model.bulkCreate(data, options);
    } catch (error) {
      logger.error(`Error bulk creating ${this.model.name}`, { error: error.message });
      throw error;
    }
  }

  /**
   * Transaction wrapper
   */
  async transaction(callback) {
    const transaction = await this.model.sequelize.transaction();
    try {
      const result = await callback(transaction);
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      logger.error(`Transaction error for ${this.model.name}`, { error: error.message });
      throw error;
    }
  }
}

module.exports = BaseRepository;