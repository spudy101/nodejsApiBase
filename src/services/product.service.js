// src/services/product.service.js
const productRepository = require('../repository/product.repository');
const AppError = require('../utils/AppError');
const { ProductResponseDTO, ProductPaginatedResponseDTO } = require('../dto/product.dto');
const { logger, logAudit } = require('../utils/logger');
const { ERRORS, SUCCESS } = require('../constants/messages');
const { AUDIT_ACTIONS } = require('../constants');

class ProductService {
  /**
   * Create product
   * @param {CreateProductDTO} productDTO - Datos del producto
   * @param {string} userId - ID del usuario creador
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {ProductResponseDTO}
   */
  async createProduct(productDTO, userId, auditContext) {
    const product = await productRepository.create({
      ...productDTO,
      createdBy: userId
    });

    // Audit log
    logAudit(AUDIT_ACTIONS.PRODUCT_CREATE, userId, {
      productId: product.id,
      name: product.name
    }, auditContext);

    logger.info('Product created', {
      productId: product.id,
      userId
    });

    // Return with creator info
    const productWithCreator = await productRepository.findByIdWithCreator(product.id);
    return ProductResponseDTO.fromModel(productWithCreator);
  }

  /**
   * Get product by ID
   * @param {string} productId - ID del producto
   * @param {string} userId - ID del usuario solicitante
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {ProductResponseDTO}
   */
  async getProductById(productId, userId, auditContext) {
    const product = await productRepository.findByIdWithCreator(productId);

    if (!product) {
      throw AppError.notFound(ERRORS.PRODUCT_NOT_FOUND);
    }

    // Audit log
    logAudit(AUDIT_ACTIONS.PRODUCT_VIEW, userId, {
      productId: product.id,
      name: product.name
    }, auditContext);

    logger.info('Product retrieved', { productId, userId });

    return ProductResponseDTO.fromModel(product);
  }

  /**
   * List products with filters and pagination
   * @param {ProductFiltersDTO} filtersDTO - Filtros y paginación
   * @param {string} userId - ID del usuario solicitante
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {ProductPaginatedResponseDTO}
   */
  async listProducts(filtersDTO, userId, auditContext) {
    const result = await productRepository.findWithFilters(filtersDTO);

    // Audit log
    logAudit(AUDIT_ACTIONS.PRODUCT_LIST, userId, {
      filters: { 
        search: filtersDTO.search, 
        category: filtersDTO.category, 
        isActive: filtersDTO.isActive 
      },
      resultsCount: result.count
    }, auditContext);

    logger.info('Products listed', {
      count: result.count,
      page: filtersDTO.page,
      limit: filtersDTO.limit,
      userId
    });

    return ProductPaginatedResponseDTO.fromData(result.rows, {
      total: result.count,
      page: filtersDTO.page,
      limit: filtersDTO.limit
    });
  }

  /**
   * Update product
   * @param {string} productId - ID del producto
   * @param {UpdateProductDTO} updateDTO - Datos a actualizar
   * @param {string} userId - ID del usuario
   * @param {string} userRole - Rol del usuario
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {ProductResponseDTO}
   */
  async updateProduct(productId, updateDTO, userId, userRole, auditContext) {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw AppError.notFound(ERRORS.PRODUCT_NOT_FOUND);
    }

    // Check ownership (unless admin)
    if (userRole !== 'admin' && product.createdBy !== userId) {
      throw AppError.forbidden(ERRORS.FORBIDDEN);
    }

    await productRepository.update(productId, updateDTO);

    // Audit log
    logAudit(AUDIT_ACTIONS.PRODUCT_UPDATE, userId, {
      productId,
      updatedFields: Object.keys(updateDTO)
    }, auditContext);

    logger.info('Product updated', {
      productId,
      userId,
      updatedFields: Object.keys(updateDTO)
    });

    const updatedProduct = await productRepository.findByIdWithCreator(productId);
    return ProductResponseDTO.fromModel(updatedProduct);
  }

  /**
   * Delete product (soft delete)
   * @param {string} productId - ID del producto
   * @param {string} userId - ID del usuario
   * @param {string} userRole - Rol del usuario
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Object} Mensaje de confirmación
   */
  async deleteProduct(productId, userId, userRole, auditContext) {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw AppError.notFound(ERRORS.PRODUCT_NOT_FOUND);
    }

    // Check ownership (unless admin)
    if (userRole !== 'admin' && product.createdBy !== userId) {
      throw AppError.forbidden(ERRORS.FORBIDDEN);
    }

    // Soft delete (set as inactive)
    await productRepository.softDelete(productId);

    // Audit log
    logAudit(AUDIT_ACTIONS.PRODUCT_DELETE, userId, {
      productId,
      productName: product.name
    }, auditContext);

    logger.info('Product deleted', { productId, userId });

    return { message: SUCCESS.PRODUCT_DELETED };
  }

  /**
   * Get product categories
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Array<string>} Lista de categorías
   */
  async getCategories(auditContext) {
    const categories = await productRepository.getCategories();

    logger.info('Categories retrieved', { count: categories.length });

    return categories;
  }

  /**
   * Get user's products
   * @param {string} userId - ID del usuario
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Array<ProductResponseDTO>}
   */
  async getUserProducts(userId, auditContext) {
    const products = await productRepository.findByCreator(userId, {
      order: [['createdAt', 'DESC']]
    });

    logger.info('User products retrieved', {
      userId,
      count: products.length
    });

    return ProductResponseDTO.fromModelArray(products);
  }

  /**
   * Get product statistics
   * @param {string} userId - ID del usuario
   * @param {string} userRole - Rol del usuario
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Object} Estadísticas
   */
  async getStatistics(userId, userRole, auditContext) {
    // Admin can see all statistics, users only their own
    const stats = await productRepository.getStatistics(
      userRole === 'admin' ? null : userId
    );

    logger.info('Product statistics retrieved', { userId, userRole });

    return stats;
  }
}

module.exports = new ProductService();
