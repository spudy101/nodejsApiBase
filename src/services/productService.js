const { Product, User } = require('../models');
const { sequelize } = require('../models');
const { executeWithTransaction, executeQuery } = require('../utils/transactionWrapper');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

class ProductService {
  /**
   * Crear producto
   */
  async createProduct(productData, userId) {
    return executeWithTransaction(
      { ...productData, createdBy: userId },
      async (data, transaction) => {
        const product = await Product.create(data, { transaction });

        logger.info('Producto creado', { 
          productId: product.id, 
          name: product.name,
          createdBy: userId
        });

        return product.toJSON();
      },
      'createProduct',
      { sequelize }
    );
  }

  /**
   * Listar productos con paginación y filtros
   */
  async listProducts(filters = {}) {
    return executeQuery(
      async () => {
        const {
          page = 1,
          limit = 10,
          category,
          isActive,
          minPrice,
          maxPrice,
          search,
          sortBy = 'createdAt',
          sortOrder = 'DESC'
        } = filters;

        const offset = (page - 1) * limit;

        // Construir condiciones WHERE
        const where = {};

        if (category) {
          where.category = category;
        }

        if (typeof isActive === 'boolean') {
          where.isActive = isActive;
        }

        if (minPrice !== undefined || maxPrice !== undefined) {
          where.price = {};
          if (minPrice !== undefined) {
            where.price[Op.gte] = minPrice;
          }
          if (maxPrice !== undefined) {
            where.price[Op.lte] = maxPrice;
          }
        }

        if (search) {
          where[Op.or] = [
            { name: { [Op.iLike]: `%${search}%` } },
            { description: { [Op.iLike]: `%${search}%` } }
          ];
        }

        // Obtener productos y total
        const { count, rows } = await Product.findAndCountAll({
          where,
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email']
            }
          ],
          limit,
          offset,
          order: [[sortBy, sortOrder]]
        });

        logger.debug('Productos listados', { 
          total: count, 
          page, 
          limit,
          filters 
        });

        return {
          products: rows.map(product => product.toJSON()),
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        };
      },
      'listProducts',
      sequelize
    );
  }

  /**
   * Obtener producto por ID
   */
  async getProductById(productId) {
    return executeQuery(
      async () => {
        const product = await Product.findByPk(productId, {
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email']
            }
          ]
        });

        if (!product) {
          throw new Error('Producto no encontrado');
        }

        logger.debug('Producto obtenido por ID', { productId });

        return product.toJSON();
      },
      'getProductById',
      sequelize
    );
  }

  /**
   * Actualizar producto
   */
  async updateProduct(productId, updateData, userId) {
    return executeWithTransaction(
      { productId, ...updateData, userId },
      async (data, transaction) => {
        const product = await Product.findByPk(data.productId, { transaction });

        if (!product) {
          return {
            _rollback: true,
            message: 'Producto no encontrado',
            data: null
          };
        }

        // Actualizar campos permitidos
        const allowedFields = ['name', 'description', 'price', 'stock', 'category', 'isActive'];
        
        allowedFields.forEach(field => {
          if (data[field] !== undefined) {
            product[field] = data[field];
          }
        });

        await product.save({ transaction });

        logger.info('Producto actualizado', { 
          productId: product.id,
          updatedBy: userId
        });

        return product.toJSON();
      },
      'updateProduct',
      { sequelize }
    );
  }

  /**
   * Actualizar stock del producto
   */
  async updateStock(productId, quantity, operation) {
    return executeWithTransaction(
      { productId, quantity, operation },
      async (data, transaction) => {
        const product = await Product.findByPk(data.productId, { 
          transaction,
          lock: transaction.LOCK.UPDATE // Lock para evitar condiciones de carrera
        });

        if (!product) {
          return {
            _rollback: true,
            message: 'Producto no encontrado',
            data: null
          };
        }

        const oldStock = product.stock;

        switch (data.operation) {
          case 'add':
            product.stock += data.quantity;
            break;
          
          case 'subtract':
            if (product.stock < data.quantity) {
              return {
                _rollback: true,
                message: 'Stock insuficiente',
                data: { currentStock: product.stock, requested: data.quantity }
              };
            }
            product.stock -= data.quantity;
            break;
          
          case 'set':
            if (data.quantity < 0) {
              return {
                _rollback: true,
                message: 'El stock no puede ser negativo',
                data: null
              };
            }
            product.stock = data.quantity;
            break;
          
          default:
            return {
              _rollback: true,
              message: 'Operación inválida',
              data: null
            };
        }

        await product.save({ transaction });

        logger.info('Stock actualizado', { 
          productId: product.id,
          operation: data.operation,
          oldStock,
          newStock: product.stock,
          quantity: data.quantity
        });

        return {
          productId: product.id,
          name: product.name,
          oldStock,
          newStock: product.stock,
          operation: data.operation
        };
      },
      'updateStock',
      { sequelize, isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE }
    );
  }

  /**
   * Eliminar producto (soft delete)
   */
  async deleteProduct(productId) {
    return executeWithTransaction(
      { productId },
      async (data, transaction) => {
        const product = await Product.findByPk(data.productId, { transaction });

        if (!product) {
          return {
            _rollback: true,
            message: 'Producto no encontrado',
            data: null
          };
        }

        // Soft delete: marcar como inactivo
        product.isActive = false;
        await product.save({ transaction });

        logger.info('Producto desactivado (soft delete)', { 
          productId: product.id 
        });

        return { 
          message: 'Producto eliminado exitosamente',
          productId: product.id
        };
      },
      'deleteProduct',
      { sequelize }
    );
  }

  /**
   * Eliminar producto permanentemente (hard delete)
   */
  async permanentlyDeleteProduct(productId) {
    return executeWithTransaction(
      { productId },
      async (data, transaction) => {
        const product = await Product.findByPk(data.productId, { transaction });

        if (!product) {
          return {
            _rollback: true,
            message: 'Producto no encontrado',
            data: null
          };
        }

        await product.destroy({ transaction });

        logger.warn('Producto eliminado permanentemente', { 
          productId: product.id 
        });

        return { 
          message: 'Producto eliminado permanentemente',
          productId: product.id
        };
      },
      'permanentlyDeleteProduct',
      { sequelize }
    );
  }

  /**
   * Obtener productos por categoría
   */
  async getProductsByCategory(category) {
    return executeQuery(
      async () => {
        const products = await Product.findAll({
          where: { 
            category,
            isActive: true 
          },
          order: [['name', 'ASC']]
        });

        logger.debug('Productos obtenidos por categoría', { 
          category, 
          count: products.length 
        });

        return products.map(p => p.toJSON());
      },
      'getProductsByCategory',
      sequelize
    );
  }

  /**
   * Obtener estadísticas de productos
   */
  async getProductStats() {
    return executeQuery(
      async () => {
        const [stats] = await sequelize.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE "isActive" = true) as active,
            COUNT(*) FILTER (WHERE "isActive" = false) as inactive,
            COUNT(*) FILTER (WHERE stock = 0) as "outOfStock",
            COUNT(*) FILTER (WHERE stock > 0 AND stock <= 10) as "lowStock",
            AVG(price) as "averagePrice",
            SUM(stock) as "totalStock"
          FROM "Products"
        `);

        logger.debug('Estadísticas de productos obtenidas');

        return stats[0];
      },
      'getProductStats',
      sequelize
    );
  }
}

module.exports = new ProductService();