// test/unit/services/userService/delete.test.js
const userService = require('../../../../src/services/userService');
const { User } = require('../../../../src/models');
const { executeWithTransaction } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('UserService - Delete User', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe eliminar usuario permanentemente (hard delete)', async () => {
    // ARRANGE
    const userId = 'user-123';
    const mockUser = {
      id: userId,
      name: 'User to Delete',
      email: 'delete@example.com',
      destroy: jest.fn()
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    const result = await userService.deleteUser(userId);

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data.message).toContain('Usuario eliminado permanentemente');
    expect(mockUser.destroy).toHaveBeenCalledWith({ transaction: expect.anything() });
  });

  it('debe eliminar usuario con la transacción activa', async () => {
    // ARRANGE
    const mockTransaction = { id: 'transaction-123' };
    const mockUser = {
      id: 'user-123',
      destroy: jest.fn()
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, mockTransaction);
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await userService.deleteUser('user-123');

    // ASSERT
    expect(mockUser.destroy).toHaveBeenCalledWith({ 
      transaction: mockTransaction 
    });
  });

  it('debe rechazar eliminación si usuario no existe', async () => {
    // ARRANGE
    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return result;
    });

    User.findByPk = jest.fn().mockResolvedValue(null);

    // ACT
    const result = await userService.deleteUser('user-999');

    // ASSERT
    expect(result._rollback).toBe(true);
    expect(result.message).toBe('Usuario no encontrado');
    expect(result.data).toBeNull();
  });

  it('debe buscar usuario dentro de la transacción', async () => {
    // ARRANGE
    const mockTransaction = { id: 'transaction-123' };
    const mockUser = {
      id: 'user-123',
      destroy: jest.fn()
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, mockTransaction);
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await userService.deleteUser('user-123');

    // ASSERT
    expect(User.findByPk).toHaveBeenCalledWith('user-123', { 
      transaction: mockTransaction 
    });
  });

  it('debe retornar mensaje de confirmación después de eliminar', async () => {
    // ARRANGE
    const mockUser = {
      id: 'user-123',
      destroy: jest.fn()
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    const result = await userService.deleteUser('user-123');

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('message');
    expect(result.data.message).toBe('Usuario eliminado permanentemente');
  });

  it('debe ser una eliminación permanente no soft delete', async () => {
    // ARRANGE
    const mockUser = {
      id: 'user-123',
      isActive: true,
      save: jest.fn(),
      destroy: jest.fn()
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await userService.deleteUser('user-123');

    // ASSERT
    expect(mockUser.destroy).toHaveBeenCalled(); // Hard delete
    expect(mockUser.save).not.toHaveBeenCalled(); // No es soft delete
  });
});