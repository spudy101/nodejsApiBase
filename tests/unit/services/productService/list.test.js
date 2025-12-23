// test/unit/services/productService/list.test.js
const productService = require('../../../../src/services/productService');
const { Product, User } = require('../../../../src/models');
const { executeQuery } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('ProductService - List Products', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe listar productos con paginación por defecto', async () => {
    // ARRANGE
    const mockProducts = [
      {
        id: 'prod-1',
        name: 'Producto 1',
        price: 100000,
        toJSON: jest.fn().mockReturnValue({ id: 'prod-1', name: 'Producto 1' })
      },
      {
        id: 'prod-2',
        name: 'Producto 2',
        price: 200000,
        toJSON: jest.fn().mockReturnValue({ id: 'prod-2', name: 'Producto 2' })
      }
    ];

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 2,
      rows: mockProducts
    });

    // ACT
    const result = await productService.listProducts();

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data.products).toHaveLength(2);
    expect(result.data.pagination).toEqual({
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    });
  });

  it('debe incluir información del creador del producto', async () => {
    // ARRANGE
    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 0,
      rows: []
    });

    // ACT
    await productService.listProducts();

    // ASSERT
    expect(Product.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        include: expect.arrayContaining([
          expect.objectContaining({
            model: User,
            as: 'creator',
            attributes: ['id', 'name', 'email']
          })
        ])
      })
    );
  });

  it('debe filtrar productos por categoría', async () => {
    // ARRANGE
    const filters = {
      category: 'electronics'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 5,
      rows: []
    });

    // ACT
    await productService.listProducts(filters);

    // ASSERT
    expect(Product.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'electronics'
        })
      })
    );
  });

  it('debe filtrar productos por estado activo', async () => {
    // ARRANGE
    const filters = {
      isActive: true
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 10,
      rows: []
    });

    // ACT
    await productService.listProducts(filters);

    // ASSERT
    expect(Product.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true
        })
      })
    );
  });

  it('debe filtrar productos por rango de precios (minPrice y maxPrice)', async () => {
    // ARRANGE
    const { Op } = require('sequelize');
    const filters = {
      minPrice: 50000,
      maxPrice: 500000
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 15,
      rows: []
    });

    // ACT
    await productService.listProducts(filters);

    // ASSERT
    expect(Product.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          price: expect.objectContaining({
            [Op.gte]: 50000,
            [Op.lte]: 500000
          })
        })
      })
    );
  });

  it('debe filtrar productos por precio mínimo solamente', async () => {
    // ARRANGE
    const { Op } = require('sequelize');
    const filters = {
      minPrice: 100000
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 20,
      rows: []
    });

    // ACT
    await productService.listProducts(filters);

    // ASSERT
    expect(Product.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          price: expect.objectContaining({
            [Op.gte]: 100000
          })
        })
      })
    );
  });

  it('debe filtrar productos por precio máximo solamente', async () => {
    // ARRANGE
    const { Op } = require('sequelize');
    const filters = {
      maxPrice: 200000
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 25,
      rows: []
    });

    // ACT
    await productService.listProducts(filters);

    // ASSERT
    expect(Product.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          price: expect.objectContaining({
            [Op.lte]: 200000
          })
        })
      })
    );
  });

  it('debe buscar productos por nombre o descripción con search', async () => {
    // ARRANGE
    const { Op } = require('sequelize');
    const filters = {
      search: 'laptop'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 3,
      rows: []
    });

    // ACT
    await productService.listProducts(filters);

    // ASSERT
    expect(Product.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          [Op.or]: expect.arrayContaining([
            expect.objectContaining({ name: expect.anything() }),
            expect.objectContaining({ description: expect.anything() })
          ])
        })
      })
    );
  });

  it('debe ordenar productos por campo personalizado', async () => {
    // ARRANGE
    const filters = {
      sortBy: 'price',
      sortOrder: 'ASC'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 10,
      rows: []
    });

    // ACT
    await productService.listProducts(filters);

    // ASSERT
    expect(Product.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['price', 'ASC']]
      })
    );
  });

  it('debe usar ordenamiento por defecto (createdAt DESC)', async () => {
    // ARRANGE
    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 0,
      rows: []
    });

    // ACT
    await productService.listProducts();

    // ASSERT
    expect(Product.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['createdAt', 'DESC']]
      })
    );
  });

  it('debe combinar múltiples filtros correctamente', async () => {
    // ARRANGE
    const filters = {
      category: 'electronics',
      isActive: true,
      minPrice: 100000,
      maxPrice: 1000000,
      search: 'laptop',
      page: 2,
      limit: 20,
      sortBy: 'name',
      sortOrder: 'ASC'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 50,
      rows: []
    });

    // ACT
    const result = await productService.listProducts(filters);

    // ASSERT
    expect(Product.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'electronics',
          isActive: true
        }),
        limit: 20,
        offset: 20, // page 2, limit 20
        order: [['name', 'ASC']]
      })
    );

    expect(result.data.pagination).toEqual({
      total: 50,
      page: 2,
      limit: 20,
      totalPages: 3
    });
  });

  it('debe calcular correctamente totalPages', async () => {
    // ARRANGE
    const filters = {
      limit: 10
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    Product.findAndCountAll = jest.fn().mockResolvedValue({
      count: 47,
      rows: []
    });

    // ACT
    const result = await productService.listProducts(filters);

    // ASSERT
    expect(result.data.pagination.totalPages).toBe(5); // Math.ceil(47/10)
  });
});