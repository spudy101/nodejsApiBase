// src/controllers/product.controller.js
const productService = require('../services/product.service');
const { CreateProductDTO, UpdateProductDTO, ProductFiltersDTO } = require('../dto/product.dto');
const ApiResponse = require('../utils/response');
const { SUCCESS } = require('../constants/messages');

class ProductController {
  /**
   * Create product
   * POST /api/products
   */
  async createProduct(req, res, next) {
    try {
      // Convertir req.body a DTO
      const productDTO = CreateProductDTO.fromRequest(req.body);
      
      const product = await productService.createProduct(
        productDTO,
        req.user.id,
        res.locals.auditContext
      );

      return ApiResponse.created(
        res,
        SUCCESS.PRODUCT_CREATED,
        product
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  async getProduct(req, res, next) {
    try {
      const product = await productService.getProductById(
        req.params.id, 
        req.user?.id, 
        res.locals.auditContext
      );
      
      return ApiResponse.success(
        res,
        'Producto obtenido exitosamente',
        product
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * List products
   * GET /api/products
   */
  async listProducts(req, res, next) {
    try {
      // Convertir query params a DTO
      const filtersDTO = ProductFiltersDTO.fromQuery(req.query);
      
      const result = await productService.listProducts(
        filtersDTO,
        req.user?.id, 
        res.locals.auditContext
      );
      
      // Set pagination headers
      res.setHeader('X-Total-Count', result.pagination.total);
      res.setHeader('X-Page', result.pagination.page);
      res.setHeader('X-Limit', result.pagination.limit);
      
      return ApiResponse.success(
        res,
        'Productos obtenidos exitosamente',
        result.products,
        200,
        result.pagination
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update product
   * PUT /api/products/:id
   */
  async updateProduct(req, res, next) {
    try {
      // Convertir req.body a DTO
      const updateDTO = UpdateProductDTO.fromRequest(req.body);
      
      const product = await productService.updateProduct(
        req.params.id,
        updateDTO,
        req.user.id,
        req.user.role,
        res.locals.auditContext
      );
      
      return ApiResponse.success(
        res,
        SUCCESS.PRODUCT_UPDATED,
        product
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  async deleteProduct(req, res, next) {
    try {
      const result = await productService.deleteProduct(
        req.params.id,
        req.user.id,
        req.user.role,
        res.locals.auditContext
      );
      
      return ApiResponse.success(
        res,
        result.message
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get categories
   * GET /api/products/categories
   */
  async getCategories(req, res, next) {
    try {
      const categories = await productService.getCategories(res.locals.auditContext);
      
      return ApiResponse.success(
        res,
        'Categorías obtenidas exitosamente',
        { categories }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's products
   * GET /api/products/my-products
   */
  async getUserProducts(req, res, next) {
    try {
      const products = await productService.getUserProducts(
        req.user.id, 
        res.locals.auditContext
      );
      
      return ApiResponse.success(
        res,
        'Productos del usuario obtenidos exitosamente',
        { products }
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics
   * GET /api/products/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await productService.getStatistics(
        req.user.id, 
        req.user.role, 
        res.locals.auditContext
      );
      
      return ApiResponse.success(
        res,
        'Estadísticas obtenidas exitosamente',
        { stats }
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
