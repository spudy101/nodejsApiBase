// test/unit/services/productService/stats.test.js
const productService = require('../../../../src/services/productService');
const { sequelize } = require('../../../../src/models');
const { executeQuery } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('ProductService - Get Product Stats', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener estadísticas de productos correctamente', async () => {
    // ARRANGE
    const mockStats = {
      total: '250',
      active: '200',
      inactive: '50',
      outOfStock: '15',
      lowStock: '30',
      averagePrice: '350000.50',
      totalStock: '5000'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await productService.getProductStats();

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data).toEqual(mockStats);
  });

  it('debe ejecutar query SQL para obtener estadísticas', async () => {
    // ARRANGE
    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[{}]]);

    // ACT
    await productService.getProductStats();

    // ASSERT
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('COUNT(*)')
    );
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM "Products"')
    );
  });

  it('debe contar total de productos', async () => {
    // ARRANGE
    const mockStats = {
      total: '100'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await productService.getProductStats();

    // ASSERT
    expect(result.data).toHaveProperty('total');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('COUNT(*) as total')
    );
  });

  it('debe contar productos activos', async () => {
    // ARRANGE
    const mockStats = {
      active: '85'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await productService.getProductStats();

    // ASSERT
    expect(result.data).toHaveProperty('active');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('"isActive" = true')
    );
  });

  it('debe contar productos inactivos', async () => {
    // ARRANGE
    const mockStats = {
      inactive: '15'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await productService.getProductStats();

    // ASSERT
    expect(result.data).toHaveProperty('inactive');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('"isActive" = false')
    );
  });

  it('debe contar productos sin stock (outOfStock)', async () => {
    // ARRANGE
    const mockStats = {
      outOfStock: '10'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await productService.getProductStats();

    // ASSERT
    expect(result.data).toHaveProperty('outOfStock');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('stock = 0')
    );
  });

  it('debe contar productos con stock bajo (lowStock)', async () => {
    // ARRANGE
    const mockStats = {
      lowStock: '25'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await productService.getProductStats();

    // ASSERT
    expect(result.data).toHaveProperty('lowStock');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('stock > 0 AND stock <= 10')
    );
  });

  it('debe calcular precio promedio', async () => {
    // ARRANGE
    const mockStats = {
      averagePrice: '450000.75'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await productService.getProductStats();

    // ASSERT
    expect(result.data).toHaveProperty('averagePrice');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('AVG(price)')
    );
  });

  it('debe calcular stock total', async () => {
    // ARRANGE
    const mockStats = {
      totalStock: '7500'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await productService.getProductStats();

    // ASSERT
    expect(result.data).toHaveProperty('totalStock');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('SUM(stock)')
    );
  });

  it('debe retornar todas las estadísticas juntas', async () => {
    // ARRANGE
    const mockStats = {
      total: '100',
      active: '85',
      inactive: '15',
      outOfStock: '10',
      lowStock: '20',
      averagePrice: '300000.00',
      totalStock: '5000'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await productService.getProductStats();

    // ASSERT
    expect(result.data).toMatchObject({
      total: expect.any(String),
      active: expect.any(String),
      inactive: expect.any(String),
      outOfStock: expect.any(String),
      lowStock: expect.any(String),
      averagePrice: expect.any(String),
      totalStock: expect.any(String)
    });
  });

  it('debe usar executeQuery para manejar la consulta', async () => {
    // ARRANGE
    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[{}]]);

    // ACT
    await productService.getProductStats();

    // ASSERT
    expect(executeQuery).toHaveBeenCalledWith(
      expect.any(Function),
      'getProductStats',
      sequelize
    );
  });
});