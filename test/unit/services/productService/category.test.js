// test/unit/services/productService/category.test.js
const productService = require('../../../../src/services/productService');
const { Product } = require('../../../../src/models');
const { executeQuery } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('ProductService - Get Products By Category', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener productos por categoría correctamente', async () => {
    // ARRANGE
    const category = 'electronics';
    const mockProducts = [
      {
        id: 'prod-1',
        name: 'Laptop',
        category: 'electronics',
        isActive: true,
        toJSON: jest.fn().mockReturnValue({ id: 'prod-1', name: 'Laptop' })
      },
      {
        id: 'prod-2',
        name: 'Mouse',
        category: 'electronics',
        isActive: true,
        toJSON: jest.fn().mockReturnValue({ id: 'prod-2', name: 'Mouse' })
      }
    ];

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAll = jest.fn().mockResolvedValue(mockProducts);

    // ACT
    const result = await productService.getProductsByCategory(category);

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(Product.findAll).toHaveBeenCalledWith({
      where: { 
        category: 'electronics',
        isActive: true 
      },
      order: [['name', 'ASC']]
    });
  });

  it('debe retornar solo productos activos', async () => {
    // ARRANGE
    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAll = jest.fn().mockResolvedValue([]);

    // ACT
    await productService.getProductsByCategory('accessories');

    // ASSERT
    expect(Product.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true
        })
      })
    );
  });

  it('debe ordenar productos por nombre ascendente', async () => {
    // ARRANGE
    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAll = jest.fn().mockResolvedValue([]);

    // ACT
    await productService.getProductsByCategory('audio');

    // ASSERT
    expect(Product.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['name', 'ASC']]
      })
    );
  });

  it('debe buscar por categoría exacta', async () => {
    // ARRANGE
    const category = 'gaming';

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAll = jest.fn().mockResolvedValue([]);

    // ACT
    await productService.getProductsByCategory(category);

    // ASSERT
    expect(Product.findAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'gaming'
        })
      })
    );
  });

  it('debe convertir productos a JSON antes de retornar', async () => {
    // ARRANGE
    const mockProduct = {
      id: 'prod-1',
      name: 'Teclado',
      toJSON: jest.fn().mockReturnValue({ id: 'prod-1', name: 'Teclado' })
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAll = jest.fn().mockResolvedValue([mockProduct]);

    // ACT
    const result = await productService.getProductsByCategory('accessories');

    // ASSERT
    expect(mockProduct.toJSON).toHaveBeenCalled();
    expect(result.data[0]).toEqual({ id: 'prod-1', name: 'Teclado' });
  });

  it('debe retornar array vacío si no hay productos en la categoría', async () => {
    // ARRANGE
    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAll = jest.fn().mockResolvedValue([]);

    // ACT
    const result = await productService.getProductsByCategory('categoria-sin-productos');

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.data).toHaveLength(0);
  });

  it('debe funcionar con diferentes categorías', async () => {
    // ARRANGE
    const categories = ['electronics', 'accessories', 'audio', 'gaming', 'office'];

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAll = jest.fn().mockResolvedValue([]);

    // ACT & ASSERT
    for (const category of categories) {
      await productService.getProductsByCategory(category);
      
      expect(Product.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: category
          })
        })
      );
    }
  });
});