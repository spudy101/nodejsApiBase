// test/unit/services/authService/register.test.js
const authService = require('../../../../src/services/authService');
const { User } = require('../../../../src/models');
const { generateToken } = require('../../../../src/utils/jwtHelper');
const { executeWithTransaction } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/jwtHelper');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('AuthService - Register', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe registrar usuario exitosamente con rol por defecto "user"', async () => {
    // ARRANGE
    const userData = {
      email: 'nuevo@example.com',
      password: 'Password123',
      name: 'Nuevo Usuario'
    };

    const mockUser = {
      id: 'uuid-123',
      email: userData.email,
      name: userData.name,
      role: 'user',
      toJSON: jest.fn().mockReturnValue({
        id: 'uuid-123',
        email: userData.email,
        name: userData.name,
        role: 'user'
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.create = jest.fn().mockResolvedValue(mockUser);
    generateToken.mockReturnValue('jwt-token-abc123');

    // ACT
    const result = await authService.register(userData);

    // ASSERT
    expect(result.success).toBe(true);
    expect(result.data.user).toHaveProperty('email', userData.email);
    expect(result.data.user).toHaveProperty('name', userData.name);
    expect(result.data.user).toHaveProperty('role', 'user');
    expect(result.data.token).toBe('jwt-token-abc123');
    
    expect(User.create).toHaveBeenCalledTimes(1);
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        role: 'user'
      }),
      expect.objectContaining({ transaction: expect.anything() })
    );
    
    expect(generateToken).toHaveBeenCalledTimes(1);
    expect(generateToken).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role
      })
    );
  });

  it('debe registrar usuario con rol "admin" si se especifica', async () => {
    // ARRANGE
    const userData = {
      email: 'admin@example.com',
      password: 'AdminPass123',
      name: 'Admin User',
      role: 'admin'
    };

    const mockUser = {
      id: 'uuid-456',
      role: 'admin',
      toJSON: jest.fn().mockReturnValue({ 
        id: 'uuid-456', 
        role: 'admin',
        email: userData.email
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.create = jest.fn().mockResolvedValue(mockUser);
    generateToken.mockReturnValue('token');

    // ACT
    await authService.register(userData);

    // ASSERT
    expect(User.create).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'admin' }),
      expect.anything()
    );
  });

  it('debe retornar usuario sin el campo password en la respuesta', async () => {
    // ARRANGE
    const userData = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test'
    };

    const mockUser = {
      id: 'uuid-789',
      email: userData.email,
      password: 'hashed-password-should-not-appear',
      toJSON: jest.fn().mockReturnValue({
        id: 'uuid-789',
        email: userData.email,
        // password NO debe estar aquí
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.create = jest.fn().mockResolvedValue(mockUser);
    generateToken.mockReturnValue('token');

    // ACT
    const result = await authService.register(userData);

    // ASSERT
    expect(result.data.user).not.toHaveProperty('password');
  });

  it('debe generar token JWT válido después del registro', async () => {
    // ARRANGE
    const userData = {
      email: 'test@example.com',
      password: 'Password123',
      name: 'Test'
    };

    const mockUser = {
      id: 'user-123',
      email: userData.email,
      role: 'user',
      toJSON: jest.fn().mockReturnValue({
        id: 'user-123',
        email: userData.email,
        role: 'user'
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    User.create = jest.fn().mockResolvedValue(mockUser);
    generateToken.mockReturnValue('generated-token-xyz');

    // ACT
    const result = await authService.register(userData);

    // ASSERT
    expect(generateToken).toHaveBeenCalledWith({
      id: mockUser.id,
      email: mockUser.email,
      role: mockUser.role
    });
    expect(result.data.token).toBe('generated-token-xyz');
  });

  it('debe manejar error si el email ya existe', async () => {
    // ARRANGE
    const userData = {
      email: 'duplicado@example.com',
      password: 'Password123',
      name: 'Test'
    };

    const duplicateError = new Error('Validation error');
    duplicateError.name = 'SequelizeUniqueConstraintError';

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      await businessLogic(data, {});
      throw duplicateError;
    });

    User.create = jest.fn().mockRejectedValue(duplicateError);

    // ACT & ASSERT
    await expect(authService.register(userData))
      .rejects
      .toThrow();
  });
});