// test/unit/services/userService/list.test.js
const userService = require('../../../../src/services/userService');
const { User } = require('../../../../src/models');
const { executeQuery } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('UserService - List Users', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe listar usuarios con paginación por defecto', async () => {
    // ARRANGE
    const mockUsers = [
      {
        id: 'user-1',
        name: 'Usuario 1',
        email: 'user1@example.com',
        role: 'user',
        isActive: true,
        toJSON: jest.fn().mockReturnValue({
          id: 'user-1',
          name: 'Usuario 1',
          email: 'user1@example.com',
          role: 'user'
        })
      },
      {
        id: 'user-2',
        name: 'Usuario 2',
        email: 'user2@example.com',
        role: 'user',
        isActive: true,
        toJSON: jest.fn().mockReturnValue({
          id: 'user-2',
          name: 'Usuario 2',
          email: 'user2@example.com',
          role: 'user'
        })
      }
    ];

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 2,
      rows: mockUsers
    });

    // ACT
    const result = await userService.listUsers();

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data.users).toHaveLength(2);
    expect(result.data.pagination).toEqual({
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    });
    
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 10,
        offset: 0,
        order: [['createdAt', 'DESC']]
      })
    );
  });

  it('debe calcular correctamente el offset con paginación personalizada', async () => {
    // ARRANGE
    const filters = {
      page: 3,
      limit: 20
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 100,
      rows: []
    });

    // ACT
    await userService.listUsers(filters);

    // ASSERT
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
        offset: 40 // (page 3 - 1) * limit 20 = 40
      })
    );
  });

  it('debe filtrar usuarios por rol', async () => {
    // ARRANGE
    const filters = {
      role: 'admin'
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 5,
      rows: []
    });

    // ACT
    await userService.listUsers(filters);

    // ASSERT
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'admin'
        })
      })
    );
  });

  it('debe filtrar usuarios por estado activo', async () => {
    // ARRANGE
    const filters = {
      isActive: true
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 10,
      rows: []
    });

    // ACT
    await userService.listUsers(filters);

    // ASSERT
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: true
        })
      })
    );
  });

  it('debe filtrar usuarios por estado inactivo', async () => {
    // ARRANGE
    const filters = {
      isActive: false
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 3,
      rows: []
    });

    // ACT
    await userService.listUsers(filters);

    // ASSERT
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isActive: false
        })
      })
    );
  });

  it('debe buscar usuarios por nombre o email con search', async () => {
    // ARRANGE
    const filters = {
      search: 'juan'
    };

    const { Op } = require('sequelize');

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 2,
      rows: []
    });

    // ACT
    await userService.listUsers(filters);

    // ASSERT
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          [Op.or]: expect.arrayContaining([
            expect.objectContaining({ name: expect.anything() }),
            expect.objectContaining({ email: expect.anything() })
          ])
        })
      })
    );
  });

  it('debe combinar múltiples filtros correctamente', async () => {
    // ARRANGE
    const filters = {
      role: 'user',
      isActive: true,
      search: 'test',
      page: 2,
      limit: 15
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 25,
      rows: []
    });

    // ACT
    const result = await userService.listUsers(filters);

    // ASSERT
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: 'user',
          isActive: true
        }),
        limit: 15,
        offset: 15 // page 2, limit 15 = offset 15
      })
    );
    
    expect(result.data.pagination).toEqual({
      total: 25,
      page: 2,
      limit: 15,
      totalPages: 2
    });
  });

  it('debe excluir el campo password de los resultados', async () => {
    // ARRANGE
    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 0,
      rows: []
    });

    // ACT
    await userService.listUsers();

    // ASSERT
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        attributes: { exclude: ['password'] }
      })
    );
  });

  it('debe calcular totalPages correctamente', async () => {
    // ARRANGE
    const filters = {
      limit: 10
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 47, // 47 usuarios
      rows: []
    });

    // ACT
    const result = await userService.listUsers(filters);

    // ASSERT
    expect(result.data.pagination.totalPages).toBe(5); // Math.ceil(47/10) = 5
  });

  it('debe ordenar usuarios por fecha de creación descendente', async () => {
    // ARRANGE
    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 0,
      rows: []
    });

    // ACT
    await userService.listUsers();

    // ASSERT
    expect(User.findAndCountAll).toHaveBeenCalledWith(
      expect.objectContaining({
        order: [['createdAt', 'DESC']]
      })
    );
  });

  it('debe convertir usuarios a JSON antes de retornar', async () => {
    // ARRANGE
    const mockUser = {
      id: 'user-1',
      toJSON: jest.fn().mockReturnValue({ id: 'user-1', name: 'Test' })
    };

    executeQuery.mockImplementation(async (queryLogic) => {
      const result = await queryLogic();
      return { success: true, data: result };
    });

    User.findAndCountAll = jest.fn().mockResolvedValue({
      count: 1,
      rows: [mockUser]
    });

    // ACT
    const result = await userService.listUsers();

    // ASSERT
    expect(mockUser.toJSON).toHaveBeenCalled();
    expect(result.data.users[0]).toEqual({ id: 'user-1', name: 'Test' });
  });
});