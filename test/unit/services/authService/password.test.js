// test/unit/services/authService/password.test.js
const authService = require('../../../../src/services/authService');
const { User } = require('../../../../src/models');
const { executeWithTransaction } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('AuthService - Change Password', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe cambiar contraseña exitosamente', async () => {
    // ARRANGE
    const userId = 'user-123';
    const currentPassword = 'OldPassword123';
    const newPassword = 'NewPassword456';

    const mockUser = {
      id: userId,
      password: 'oldHashedPassword',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn()
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    const result = await authService.changePassword(
      userId,
      currentPassword,
      newPassword
    );

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data.message).toContain('Contraseña actualizada exitosamente');
    expect(mockUser.comparePassword).toHaveBeenCalledWith(currentPassword);
    expect(mockUser.password).toBe(newPassword);
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('debe verificar que la contraseña actual es correcta antes de cambiar', async () => {
    // ARRANGE
    const mockUser = {
      id: 'user-123',
      password: 'currentHash',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn()
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await authService.changePassword('user-123', 'CurrentPass123', 'NewPass456');

    // ASSERT
    expect(mockUser.comparePassword).toHaveBeenCalledWith('CurrentPass123');
    expect(mockUser.comparePassword).toHaveBeenCalledTimes(1);
  });

  it('debe rechazar cambio si contraseña actual es incorrecta', async () => {
    // ARRANGE
    const mockUser = {
      id: 'user-123',
      comparePassword: jest.fn().mockResolvedValue(false)
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return result;
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    const result = await authService.changePassword(
      'user-123',
      'wrongPassword',
      'newPassword'
    );

    // ASSERT
    expect(result._rollback).toBe(true);
    expect(result.message).toContain('contraseña actual es incorrecta');
  });

  it('debe rechazar cambio si usuario no existe', async () => {
    // ARRANGE
    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return result;
    });

    User.findByPk = jest.fn().mockResolvedValue(null);

    // ACT
    const result = await authService.changePassword(
      'user-999',
      'currentPass',
      'newPass'
    );

    // ASSERT
    expect(result._rollback).toBe(true);
    expect(result.message).toBe('Usuario no encontrado');
  });

  it('debe guardar la nueva contraseña en el modelo', async () => {
    // ARRANGE
    const newPassword = 'SuperSecurePassword456';
    const mockUser = {
      id: 'user-123',
      password: 'oldPassword',
      comparePassword: jest.fn().mockResolvedValue(true),
      save: jest.fn()
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await authService.changePassword('user-123', 'OldPass123', newPassword);

    // ASSERT
    expect(mockUser.password).toBe(newPassword);
    expect(mockUser.save).toHaveBeenCalledWith({ transaction: expect.anything() });
  });
});