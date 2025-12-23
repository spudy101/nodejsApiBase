// test/unit/middlewares/authMiddleware/optionalAuth.test.js
const { optionalAuth } = require('../../../../src/middlewares/authMiddleware');
const { verifyToken } = require('../../../../src/utils/jwtHelper');
const { User } = require('../../../../src/models');

jest.mock('../../../../src/utils/jwtHelper');
jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/logger');

describe('AuthMiddleware - Optional Auth', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('debe agregar user si token es válido', async () => {
    // ARRANGE
    const token = 'valid-token';
    const decoded = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'user'
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'user',
      isActive: true
    };

    req.headers.authorization = `Bearer ${token}`;
    verifyToken.mockReturnValue(decoded);
    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await optionalAuth(req, res, next);

    // ASSERT
    expect(req.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      role: 'user'
    });
    expect(next).toHaveBeenCalled();
  });

  it('debe continuar sin error si no hay token', async () => {
    // ARRANGE
    req.headers.authorization = undefined;

    // ACT
    await optionalAuth(req, res, next);

    // ASSERT
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('debe continuar sin error si token es inválido', async () => {
    // ARRANGE
    req.headers.authorization = 'Bearer invalid-token';
    verifyToken.mockImplementation(() => {
      throw new Error('Token inválido');
    });

    // ACT
    await optionalAuth(req, res, next);

    // ASSERT
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('debe continuar sin error si usuario no existe', async () => {
    // ARRANGE
    const decoded = {
      id: 'user-999',
      email: 'noexiste@example.com',
      role: 'user'
    };

    req.headers.authorization = 'Bearer valid-token';
    verifyToken.mockReturnValue(decoded);
    User.findByPk = jest.fn().mockResolvedValue(null);

    // ACT
    await optionalAuth(req, res, next);

    // ASSERT
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('debe continuar sin error si usuario está inactivo', async () => {
    // ARRANGE
    const decoded = {
      id: 'user-123',
      email: 'inactivo@example.com',
      role: 'user'
    };

    const mockUser = {
      id: 'user-123',
      email: 'inactivo@example.com',
      role: 'user',
      isActive: false
    };

    req.headers.authorization = 'Bearer valid-token';
    verifyToken.mockReturnValue(decoded);
    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await optionalAuth(req, res, next);

    // ASSERT
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('debe continuar si header no comienza con "Bearer "', async () => {
    // ARRANGE
    req.headers.authorization = 'InvalidFormat token';

    // ACT
    await optionalAuth(req, res, next);

    // ASSERT
    expect(req.user).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('NUNCA debe lanzar error aunque falle la verificación', async () => {
    // ARRANGE
    req.headers.authorization = 'Bearer problematic-token';
    verifyToken.mockImplementation(() => {
      throw new Error('Cualquier error');
    });

    // ACT & ASSERT
    await expect(optionalAuth(req, res, next)).resolves.not.toThrow();
    expect(next).toHaveBeenCalled();
  });

  it('debe funcionar con usuarios autenticados de diferentes roles', async () => {
    // ARRANGE
    const roles = ['user', 'admin'];

    for (const role of roles) {
      jest.clearAllMocks();

      const decoded = {
        id: `user-${role}`,
        email: `${role}@example.com`,
        role: role
      };

      const mockUser = {
        id: `user-${role}`,
        email: `${role}@example.com`,
        role: role,
        isActive: true
      };

      req.headers.authorization = 'Bearer valid-token';
      verifyToken.mockReturnValue(decoded);
      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // ACT
      await optionalAuth(req, res, next);

      // ASSERT
      expect(req.user).toBeDefined();
      expect(req.user.role).toBe(role);
      expect(next).toHaveBeenCalled();
    }
  });
});