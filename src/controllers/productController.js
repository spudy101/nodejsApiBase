const productService = require('../services/productService');
const { successResponse, errorResponse, paginatedResponse } = require('../utils/responseHandler');
const logger = require('../utils/logger');

class ProductController {
  /**
   * Crear producto
   * POST /api/v1/products
   */
  async createProduct(req, res, next) {
    try {
      const userId = req.user.id;
      const productData = req.body;

      const result = await productService.createProduct(productData, userId);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Producto creado exitosamente',
        201
      );

    } catch (error) {
      logger.error('Error en createProduct controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Listar productos con filtros y paginación
   * GET /api/v1/products
   */
  async listProducts(req, res, next) {
    try {
      const filters = {
        page: req.query.page,
        limit: req.query.limit,
        category: req.query.category,
        isActive: req.query.isActive,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        search: req.query.search,
        sortBy: req.query.sortBy,
        sortOrder: req.query.sortOrder
      };

      const result = await productService.listProducts(filters);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return paginatedResponse(
        res,
        result.data.products,
        result.data.pagination.page,
        result.data.pagination.limit,
        result.data.pagination.total,
        'Productos obtenidos exitosamente'
      );

    } catch (error) {
      logger.error('Error en listProducts controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Obtener producto por ID
   * GET /api/v1/products/:id
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      const result = await productService.getProductById(id);

      if (!result.success) {
        return errorResponse(res, result.message, 404);
      }

      return successResponse(
        res,
        result.data,
        'Producto obtenido exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en getProductById controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      if (error.message === 'Producto no encontrado') {
        return errorResponse(res, error.message, 404);
      }
      
      next(error);
    }
  }

  /**
   * Actualizar producto
   * PUT /api/v1/products/:id
   */
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const updateData = req.body;

      const result = await productService.updateProduct(id, updateData, userId);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Producto actualizado exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en updateProduct controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Actualizar stock del producto
   * PATCH /api/v1/products/:id/stock
   */
  async updateStock(req, res, next) {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body;

      const result = await productService.updateStock(id, quantity, operation);

      if (!result.success) {
        return errorResponse(res, result.message, 400, result.data);
      }

      return successResponse(
        res,
        result.data,
        'Stock actualizado exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en updateStock controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Eliminar producto (soft delete)
   * DELETE /api/v1/products/:id
   */
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      const result = await productService.deleteProduct(id);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Producto eliminado exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en deleteProduct controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Eliminar producto permanentemente (Admin)
   * DELETE /api/v1/products/:id/permanent
   */
  async permanentlyDeleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      const result = await productService.permanentlyDeleteProduct(id);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Producto eliminado permanentemente',
        200
      );

    } catch (error) {
      logger.error('Error en permanentlyDeleteProduct controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Obtener productos por categoría
   * GET /api/v1/products/category/:category
   */
  async getProductsByCategory(req, res, next) {
    try {
      const { category } = req.params;

      const result = await productService.getProductsByCategory(category);

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Productos obtenidos exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en getProductsByCategory controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }

  /**
   * Obtener estadísticas de productos (Admin)
   * GET /api/v1/products/stats
   */
  async getProductStats(req, res, next) {
    try {
      const result = await productService.getProductStats();

      if (!result.success) {
        return errorResponse(res, result.message, 400);
      }

      return successResponse(
        res,
        result.data,
        'Estadísticas obtenidas exitosamente',
        200
      );

    } catch (error) {
      logger.error('Error en getProductStats controller', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      next(error);
    }
  }
}

module.exports = new ProductController();