// src/dto/product.dto.js

// ========================================
// INPUT DTOs (Request - datos entrantes)
// ========================================

/**
 * DTO para creación de producto
 */
class CreateProductDTO {
  constructor(data) {
    this.name = data.name?.trim();
    this.description = data.description?.trim();
    this.price = parseFloat(data.price);
    this.stock = parseInt(data.stock, 10);
    this.category = data.category?.trim();
  }

  static fromRequest(body) {
    return new CreateProductDTO(body);
  }
}

/**
 * DTO para actualización de producto
 */
class UpdateProductDTO {
  constructor(data) {
    // Solo incluir campos que se enviaron
    if (data.name !== undefined) this.name = data.name?.trim();
    if (data.description !== undefined) this.description = data.description?.trim();
    if (data.price !== undefined) this.price = parseFloat(data.price);
    if (data.stock !== undefined) this.stock = parseInt(data.stock, 10);
    if (data.category !== undefined) this.category = data.category?.trim();
    if (data.isActive !== undefined) this.isActive = Boolean(data.isActive);
  }

  static fromRequest(body) {
    return new UpdateProductDTO(body);
  }
}

/**
 * DTO para filtros de listado
 */
class ProductFiltersDTO {
  constructor(query) {
    this.page = parseInt(query.page, 10) || 1;
    this.limit = Math.min(parseInt(query.limit, 10) || 10, 100); // Max 100
    this.search = query.search?.trim();
    this.category = query.category?.trim();
    this.isActive = query.isActive !== undefined ? query.isActive === 'true' : undefined;
    this.sortBy = query.sortBy || 'createdAt';
    this.sortOrder = query.sortOrder === 'asc' ? 'ASC' : 'DESC';
  }

  static fromQuery(query) {
    return new ProductFiltersDTO(query);
  }
}

// ========================================
// OUTPUT DTOs (Response - datos salientes)
// ========================================

/**
 * DTO para respuesta completa de producto
 */
class ProductResponseDTO {
  constructor(product) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.price = parseFloat(product.price);
    this.stock = product.stock;
    this.category = product.category;
    this.isActive = product.isActive;
    this.createdBy = product.createdBy;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
    
    // Include creator info if available
    if (product.creator) {
      this.creator = {
        id: product.creator.id,
        name: product.creator.name,
        email: product.creator.email
      };
    }
  }

  static fromModel(product) {
    return new ProductResponseDTO(product);
  }

  static fromModelArray(products) {
    return products.map(product => new ProductResponseDTO(product));
  }
}

/**
 * DTO para listado simplificado de productos
 */
class ProductListItemDTO {
  constructor(product) {
    this.id = product.id;
    this.name = product.name;
    this.price = parseFloat(product.price);
    this.stock = product.stock;
    this.category = product.category;
    this.isActive = product.isActive;
    this.createdAt = product.createdAt;
    
    if (product.creator) {
      this.creatorName = product.creator.name;
    }
  }

  static fromModel(product) {
    return new ProductListItemDTO(product);
  }

  static fromModelArray(products) {
    return products.map(product => new ProductListItemDTO(product));
  }
}

/**
 * DTO para respuesta paginada
 */
class ProductPaginatedResponseDTO {
  constructor(products, pagination) {
    this.products = ProductListItemDTO.fromModelArray(products);
    this.pagination = {
      total: pagination.total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(pagination.total / pagination.limit)
    };
  }

  static fromData(products, pagination) {
    return new ProductPaginatedResponseDTO(products, pagination);
  }
}

module.exports = {
  // Input DTOs
  CreateProductDTO,
  UpdateProductDTO,
  ProductFiltersDTO,
  
  // Output DTOs
  ProductResponseDTO,
  ProductListItemDTO,
  ProductPaginatedResponseDTO
};
