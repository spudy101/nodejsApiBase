// test/unit/services/productService/get.test.js
const productService = require('../../../../src/services/productService');
const { Product, User } = require('../../../../src/models');
const { executeQuery } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('ProductService - Get Product', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener producto por ID correctamente', async () => {
    // ARRANGE
    const productId = 'product-123';
    const mockProduct = {
      id: productId,
      name: 'Laptop Dell',
      description: 'Laptop de alta gama',
      price: 1500000,
      stock: 10,
      category: 'electronics',
      isActive: true,
      toJSON: jest.fn().mockReturnValue({
        id: productId,
        name: 'Laptop Dell',
        price: 1500000
      })
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    const result = await productService.getProductById(productId);

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data.id).toBe(productId);
    expect(result.data.name).toBe('Laptop Dell');
  });

  it('debe incluir información del creador del producto', async () => {
    // ARRANGE
    const mockProduct = {
      id: 'product-123',
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.getProductById('product-123');

    // ASSERT
    expect(Product.findByPk).toHaveBeenCalledWith('product-123', {
      include: expect.arrayContaining([
        expect.objectContaining({
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        })
      ])
    });
  });

  it('debe lanzar error si producto no existe', async () => {
    // ARRANGE
    executeQuery.mockImplementation(async (queryLogic) => {
      await queryLogic();
      throw new Error('Producto no encontrado');
    });

    Product.findByPk = jest.fn().mockResolvedValue(null);

    // ACT & ASSERT
    await expect(productService.getProductById('product-999'))
      .rejects
      .toThrow('Producto no encontrado');
  });

  it('debe convertir producto a JSON antes de retornar', async () => {
    // ARRANGE
    const mockProduct = {
      id: 'product-123',
      name: 'Mouse Logitech',
      toJSON: jest.fn().mockReturnValue({
        id: 'product-123',
        name: 'Mouse Logitech'
      })
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    const result = await productService.getProductById('product-123');

    // ASSERT
    expect(mockProduct.toJSON).toHaveBeenCalled();
    expect(result.data).toEqual({
      id: 'product-123',
      name: 'Mouse Logitech'
    });
  });
});