// test/unit/middlewares/authMiddleware/authenticate.test.js
const { authenticate } = require('../../../../src/middlewares/authMiddleware');
const { verifyToken } = require('../../../../src/utils/jwtHelper');
const { User } = require('../../../../src/models');
const { errorResponse } = require('../../../../src/utils/responseHandler');

jest.mock('../../../../src/utils/jwtHelper');
jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/responseHandler');
jest.mock('../../../../src/utils/logger');

describe('AuthMiddleware - Authenticate', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('debe autenticar usuario con token válido', async () => {
    // ARRANGE
    const token = 'valid-token-123';
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
    await authenticate(req, res, next);

    // ASSERT
    expect(verifyToken).toHaveBeenCalledWith(token);
    expect(User.findByPk).toHaveBeenCalledWith('user-123', {
      attributes: ['id', 'email', 'role', 'isActive']
    });
    expect(req.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      role: 'user'
    });
    expect(next).toHaveBeenCalled();
  });

  it('debe rechazar si no hay header Authorization', async () => {
    // ARRANGE
    req.headers.authorization = undefined;
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    await authenticate(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'Token de autenticación no proporcionado',
      401
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar si header no comienza con "Bearer "', async () => {
    // ARRANGE
    req.headers.authorization = 'InvalidFormat token-123';
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    await authenticate(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'Token de autenticación no proporcionado',
      401
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe extraer token correctamente después de "Bearer "', async () => {
    // ARRANGE
    const token = 'extracted-token-456';
    const decoded = {
      id: 'user-456',
      email: 'user@example.com',
      role: 'admin'
    };

    const mockUser = {
      id: 'user-456',
      email: 'user@example.com',
      role: 'admin',
      isActive: true
    };

    req.headers.authorization = `Bearer ${token}`;
    verifyToken.mockReturnValue(decoded);
    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await authenticate(req, res, next);

    // ASSERT
    expect(verifyToken).toHaveBeenCalledWith(token);
  });

  it('debe rechazar si token es inválido', async () => {
    // ARRANGE
    req.headers.authorization = 'Bearer invalid-token';
    verifyToken.mockImplementation(() => {
      throw new Error('Token inválido');
    });
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    await authenticate(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'Token de autenticación inválido',
      401
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar si token está expirado', async () => {
    // ARRANGE
    req.headers.authorization = 'Bearer expired-token';
    verifyToken.mockImplementation(() => {
      throw new Error('Token expirado');
    });
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    await authenticate(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'Tu sesión ha expirado, por favor inicia sesión nuevamente',
      401
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar si usuario no existe en BD', async () => {
    // ARRANGE
    const decoded = {
      id: 'user-999',
      email: 'noexiste@example.com',
      role: 'user'
    };

    req.headers.authorization = 'Bearer valid-token';
    verifyToken.mockReturnValue(decoded);
    User.findByPk = jest.fn().mockResolvedValue(null);
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    await authenticate(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'Usuario no encontrado',
      401
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar si usuario está inactivo', async () => {
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
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    await authenticate(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'Usuario inactivo',
      403
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe agregar user al objeto request', async () => {
    // ARRANGE
    const decoded = {
      id: 'user-789',
      email: 'test@example.com',
      role: 'admin'
    };

    const mockUser = {
      id: 'user-789',
      email: 'test@example.com',
      role: 'admin',
      isActive: true
    };

    req.headers.authorization = 'Bearer valid-token';
    verifyToken.mockReturnValue(decoded);
    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await authenticate(req, res, next);

    // ASSERT
    expect(req.user).toBeDefined();
    expect(req.user).toEqual({
      id: 'user-789',
      email: 'test@example.com',
      role: 'admin'
    });
  });

  it('debe solo incluir id, email y role en req.user', async () => {
    // ARRANGE
    const decoded = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'user'
    };

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      role: 'user',
      isActive: true,
      password: 'should-not-be-included',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    req.headers.authorization = 'Bearer valid-token';
    verifyToken.mockReturnValue(decoded);
    User.findByPk = jest.fn().mockResolvedValue(mockUser);

    // ACT
    await authenticate(req, res, next);

    // ASSERT
    expect(req.user).toEqual({
      id: 'user-123',
      email: 'test@example.com',
      role: 'user'
    });
    expect(req.user).not.toHaveProperty('password');
    expect(req.user).not.toHaveProperty('isActive');
    expect(req.user).not.toHaveProperty('createdAt');
  });

  it('debe manejar errores genéricos de verificación', async () => {
    // ARRANGE
    req.headers.authorization = 'Bearer some-token';
    verifyToken.mockImplementation(() => {
      throw new Error('Error desconocido');
    });
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    await authenticate(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'Error al verificar autenticación',
      401
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe permitir autenticación con diferentes roles', async () => {
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
      await authenticate(req, res, next);

      // ASSERT
      expect(req.user.role).toBe(role);
      expect(next).toHaveBeenCalled();
    }
  });
});