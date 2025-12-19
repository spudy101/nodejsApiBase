// test/unit/services/productService/create.test.js
const productService = require('../../../../src/services/productService');
const { Product } = require('../../../../src/models');
const { executeWithTransaction } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('ProductService - Create Product', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe crear producto exitosamente', async () => {
    // ARRANGE
    const userId = 'user-123';
    const productData = {
      name: 'Laptop Dell',
      description: 'Laptop de alta gama',
      price: 1500000,
      stock: 10,
      category: 'electronics'
    };

    const mockProduct = {
      id: 'product-123',
      ...productData,
      createdBy: userId,
      toJSON: jest.fn().mockReturnValue({
        id: 'product-123',
        ...productData,
        createdBy: userId
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.create = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    const result = await productService.createProduct(productData, userId);

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data.name).toBe(productData.name);
    expect(result.data.price).toBe(productData.price);
    expect(result.data.createdBy).toBe(userId);
    
    expect(Product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        ...productData,
        createdBy: userId
      }),
      expect.objectContaining({ transaction: expect.anything() })
    );
  });

  it('debe crear producto con todos los campos obligatorios', async () => {
    // ARRANGE
    const productData = {
      name: 'Mouse Logitech',
      description: 'Mouse inalámbrico',
      price: 25000,
      stock: 50,
      category: 'accessories'
    };

    const mockProduct = {
      id: 'product-456',
      toJSON: jest.fn().mockReturnValue({ id: 'product-456' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.create = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.createProduct(productData, 'user-123');

    // ASSERT
    expect(Product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Mouse Logitech',
        description: 'Mouse inalámbrico',
        price: 25000,
        stock: 50,
        category: 'accessories'
      }),
      expect.anything()
    );
  });

  it('debe asociar el producto al usuario que lo creó', async () => {
    // ARRANGE
    const userId = 'admin-789';
    const productData = {
      name: 'Teclado Mecánico',
      description: 'Teclado RGB',
      price: 80000,
      stock: 15,
      category: 'accessories'
    };

    const mockProduct = {
      id: 'product-789',
      createdBy: userId,
      toJSON: jest.fn().mockReturnValue({ 
        id: 'product-789',
        createdBy: userId 
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.create = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    const result = await productService.createProduct(productData, userId);

    // ASSERT
    expect(result.data.createdBy).toBe(userId);
    expect(Product.create).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: userId }),
      expect.anything()
    );
  });

  it('debe crear producto dentro de una transacción', async () => {
    // ARRANGE
    const mockTransaction = { id: 'transaction-123' };
    const productData = {
      name: 'Monitor Samsung',
      description: '27 pulgadas',
      price: 300000,
      stock: 8,
      category: 'electronics'
    };

    const mockProduct = {
      id: 'product-999',
      toJSON: jest.fn().mockReturnValue({ id: 'product-999' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, mockTransaction);
      return { success: true, data: result };
    });

    Product.create = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.createProduct(productData, 'user-123');

    // ASSERT
    expect(Product.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ transaction: mockTransaction })
    );
  });

  it('debe retornar el producto creado en formato JSON', async () => {
    // ARRANGE
    const productData = {
      name: 'Audífonos Sony',
      description: 'Cancelación de ruido',
      price: 150000,
      stock: 20,
      category: 'audio'
    };

    const mockProduct = {
      id: 'product-audio',
      name: productData.name,
      toJSON: jest.fn().mockReturnValue({
        id: 'product-audio',
        name: productData.name,
        price: productData.price
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.create = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    const result = await productService.createProduct(productData, 'user-123');

    // ASSERT
    expect(mockProduct.toJSON).toHaveBeenCalled();
    expect(result.data).toHaveProperty('id');
    expect(result.data).toHaveProperty('name', productData.name);
  });

  it('debe manejar error si falla la creación', async () => {
    // ARRANGE
    const productData = {
      name: 'Producto Inválido',
      description: 'Test',
      price: -100, // Precio inválido
      stock: 5,
      category: 'test'
    };

    const validationError = new Error('Validation error: price must be positive');

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      await businessLogic(data, {});
      throw validationError;
    });

    Product.create = jest.fn().mockRejectedValue(validationError);

    // ACT & ASSERT
    await expect(productService.createProduct(productData, 'user-123'))
      .rejects
      .toThrow();
  });
});