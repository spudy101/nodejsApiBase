// src/repository/product.repository.js
const BaseRepository = require('./base.repository');
const db = require('../models');
const { Op } = require('sequelize');

class ProductRepository extends BaseRepository {
  constructor() {
    super(db.Product);
  }

  /**
   * Find products with filters and pagination
   */
  async findWithFilters(filters = {}, pagination = {}) {
    const { page = 1, limit = 10, search, category, isActive, sortBy = 'createdAt', sortOrder = 'DESC' } = filters;
    
    const where = {};

    // Search filter
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Category filter
    if (category) {
      where.category = category;
    }

    // Active filter
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const offset = (page - 1) * limit;

    return await this.findAndCountAll(where, {
      limit,
      offset,
      order: [[sortBy, sortOrder]],
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
  }

  /**
   * Find product by ID with creator
   */
  async findByIdWithCreator(id) {
    return await this.findById(id, {
      include: [
        {
          model: db.User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });
  }

  /**
   * Find products by creator
   */
  async findByCreator(createdBy, options = {}) {
    return await this.findAll({ createdBy }, options);
  }

  /**
   * Update stock
   */
  async updateStock(productId, quantity) {
    const product = await this.findById(productId);
    
    if (!product) {
      return null;
    }

    const newStock = product.stock + quantity;
    
    if (newStock < 0) {
      throw new Error('Stock insuficiente');
    }

    return await this.update(productId, { stock: newStock });
  }

  /**
   * Get products with low stock
   */
  async findLowStock(threshold = 10) {
    return await this.findAll({
      stock: { [Op.lte]: threshold },
      isActive: true
    });
  }

  /**
   * Get products by category
   */
  async findByCategory(category, options = {}) {
    return await this.findAll({ category, isActive: true }, options);
  }

  /**
   * Get all categories
   */
  async getCategories() {
    const categories = await this.model.findAll({
      attributes: [[db.Sequelize.fn('DISTINCT', db.Sequelize.col('category')), 'category']],
      where: {
        category: { [Op.ne]: null },
        isActive: true
      },
      raw: true
    });
    return categories.map(c => c.category);
  }

  /**
   * Check if user owns product
   */
  async isOwner(productId, userId) {
    const product = await this.findOne({ id: productId, createdBy: userId });
    return !!product;
  }

  /**
   * Soft delete (set as inactive)
   */
  async softDelete(productId) {
    return await this.update(productId, { isActive: false });
  }

  /**
   * Get statistics
   */
  async getStatistics(userId = null) {
    const where = userId ? { createdBy: userId } : {};

    return await this.model.findOne({
      where,
      attributes: [
        [db.Sequelize.fn('COUNT', db.Sequelize.col('id')), 'total'],
        [db.Sequelize.fn('SUM', db.Sequelize.col('stock')), 'totalStock'],
        [db.Sequelize.fn('AVG', db.Sequelize.col('price')), 'avgPrice'],
        [db.Sequelize.fn('MAX', db.Sequelize.col('price')), 'maxPrice'],
        [db.Sequelize.fn('MIN', db.Sequelize.col('price')), 'minPrice']
      ],
      raw: true
    });
  }
}

module.exports = new ProductRepository();