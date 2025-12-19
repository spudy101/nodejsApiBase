// test/unit/services/userService/stats.test.js
const userService = require('../../../../src/services/userService');
const { sequelize } = require('../../../../src/models');
const { executeQuery } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('UserService - Get User Stats', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe obtener estadísticas de usuarios correctamente', async () => {
    // ARRANGE
    const mockStats = {
      total: '100',
      active: '85',
      inactive: '15',
      admins: '5',
      users: '95'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await userService.getUserStats();

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
    await userService.getUserStats();

    // ASSERT
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('COUNT(*)')
    );
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM "Users"')
    );
  });

  it('debe contar total de usuarios', async () => {
    // ARRANGE
    const mockStats = {
      total: '50'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await userService.getUserStats();

    // ASSERT
    expect(result.data).toHaveProperty('total');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('COUNT(*) as total')
    );
  });

  it('debe contar usuarios activos', async () => {
    // ARRANGE
    const mockStats = {
      active: '40'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await userService.getUserStats();

    // ASSERT
    expect(result.data).toHaveProperty('active');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('"isActive" = true')
    );
  });

  it('debe contar usuarios inactivos', async () => {
    // ARRANGE
    const mockStats = {
      inactive: '10'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await userService.getUserStats();

    // ASSERT
    expect(result.data).toHaveProperty('inactive');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining('"isActive" = false')
    );
  });

  it('debe contar administradores', async () => {
    // ARRANGE
    const mockStats = {
      admins: '5'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await userService.getUserStats();

    // ASSERT
    expect(result.data).toHaveProperty('admins');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining("role = 'admin'")
    );
  });

  it('debe contar usuarios regulares', async () => {
    // ARRANGE
    const mockStats = {
      users: '95'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await userService.getUserStats();

    // ASSERT
    expect(result.data).toHaveProperty('users');
    expect(sequelize.query).toHaveBeenCalledWith(
      expect.stringContaining("role = 'user'")
    );
  });

  it('debe retornar todas las estadísticas juntas', async () => {
    // ARRANGE
    const mockStats = {
      total: '100',
      active: '85',
      inactive: '15',
      admins: '5',
      users: '95'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    sequelize.query = jest.fn().mockResolvedValue([[mockStats]]);

    // ACT
    const result = await userService.getUserStats();

    // ASSERT
    expect(result.data).toMatchObject({
      total: expect.any(String),
      active: expect.any(String),
      inactive: expect.any(String),
      admins: expect.any(String),
      users: expect.any(String)
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
    await userService.getUserStats();

    // ASSERT
    expect(executeQuery).toHaveBeenCalledWith(
      expect.any(Function),
      'getUserStats',
      sequelize
    );
  });
});