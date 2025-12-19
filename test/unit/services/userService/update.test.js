// test/unit/services/userService/update.test.js
const userService = require('../../../../src/services/userService');
const { User } = require('../../../../src/models');
const { executeWithTransaction } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('UserService - Update User Role', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe actualizar rol de usuario exitosamente', async () => {
    // ARRANGE
    const userId = 'user-123';
    const newRole = 'admin';

    const mockUser = {
      id: userId,
      role: 'user',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        id: userId,
        role: 'admin'
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    const result = await userService.updateUserRole(userId, newRole);

    // ASSERT
    expect(result.success).toBe(true);
    expect(mockUser.role).toBe(newRole);
    expect(mockUser.save).toHaveBeenCalledWith({ transaction: expect.anything() });
  });

  it('debe cambiar rol de user a admin', async () => {
    // ARRANGE
    const mockUser = {
      id: 'user-123',
      role: 'user',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'user-123', role: 'admin' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await userService.updateUserRole('user-123', 'admin');

    // ASSERT
    expect(mockUser.role).toBe('admin');
  });

  it('debe cambiar rol de admin a user', async () => {
    // ARRANGE
    const mockUser = {
      id: 'user-123',
      role: 'admin',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'user-123', role: 'user' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await userService.updateUserRole('user-123', 'user');

    // ASSERT
    expect(mockUser.role).toBe('user');
  });

  it('debe rechazar actualización si usuario no existe', async () => {
    // ARRANGE
    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return result;
    });

    User.findByPk = jest.fn().mockResolvedValue(null);

    // ACT
    const result = await userService.updateUserRole('user-999', 'admin');

    // ASSERT
    expect(result._rollback).toBe(true);
    expect(result.message).toBe('Usuario no encontrado');
    expect(result.data).toBeNull();
  });

  it('debe guardar el usuario dentro de la transacción', async () => {
    // ARRANGE
    const mockTransaction = { id: 'transaction-123' };
    const mockUser = {
      id: 'user-123',
      role: 'user',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'user-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, mockTransaction);
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await userService.updateUserRole('user-123', 'admin');

    // ASSERT
    expect(mockUser.save).toHaveBeenCalledWith({ 
      transaction: mockTransaction 
    });
  });

  it('debe retornar el usuario actualizado en formato JSON', async () => {
    // ARRANGE
    const mockUser = {
      id: 'user-123',
      role: 'user',
      name: 'Test User',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        id: 'user-123',
        role: 'admin',
        name: 'Test User'
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    const result = await userService.updateUserRole('user-123', 'admin');

    // ASSERT
    expect(mockUser.toJSON).toHaveBeenCalled();
    expect(result.data).toHaveProperty('id', 'user-123');
    expect(result.data).toHaveProperty('role', 'admin');
  });

  it('debe buscar usuario con la transacción activa', async () => {
    // ARRANGE
    const mockTransaction = { id: 'transaction-123' };
    const mockUser = {
      id: 'user-123',
      role: 'user',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'user-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, mockTransaction);
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await userService.updateUserRole('user-123', 'admin');

    // ASSERT
    expect(User.findByPk).toHaveBeenCalledWith('user-123', { 
      transaction: mockTransaction 
    });
  });
});