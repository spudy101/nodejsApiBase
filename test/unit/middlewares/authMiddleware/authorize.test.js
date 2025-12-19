// test/unit/middlewares/authMiddleware/authorize.test.js
const { authorize } = require('../../../../src/middlewares/authMiddleware');
const { errorResponse } = require('../../../../src/utils/responseHandler');

jest.mock('../../../../src/utils/responseHandler');
jest.mock('../../../../src/utils/logger');

describe('AuthMiddleware - Authorize', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('debe permitir acceso si usuario tiene rol permitido', () => {
    // ARRANGE
    req.user = {
      id: 'user-123',
      email: 'admin@example.com',
      role: 'admin'
    };

    const middleware = authorize('admin');

    // ACT
    middleware(req, res, next);

    // ASSERT
    expect(next).toHaveBeenCalled();
    expect(errorResponse).not.toHaveBeenCalled();
  });

  it('debe permitir acceso con múltiples roles permitidos', () => {
    // ARRANGE
    req.user = {
      id: 'user-123',
      email: 'user@example.com',
      role: 'user'
    };

    const middleware = authorize('user', 'admin');

    // ACT
    middleware(req, res, next);

    // ASSERT
    expect(next).toHaveBeenCalled();
  });

  it('debe rechazar acceso si usuario no tiene rol permitido', () => {
    // ARRANGE
    req.user = {
      id: 'user-123',
      email: 'user@example.com',
      role: 'user'
    };

    const middleware = authorize('admin');
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    middleware(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'No tienes permisos para acceder a este recurso',
      403
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar si no hay usuario en request', () => {
    // ARRANGE
    req.user = null;

    const middleware = authorize('admin');
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    middleware(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'Usuario no autenticado',
      401
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe rechazar si usuario no está definido', () => {
    // ARRANGE
    req.user = undefined;

    const middleware = authorize('admin');
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    middleware(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'Usuario no autenticado',
      401
    );
  });

  it('debe permitir solo rol admin cuando se especifica', () => {
    // ARRANGE - Usuario con rol user
    req.user = {
      id: 'user-123',
      role: 'user'
    };

    const middleware = authorize('admin');
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    middleware(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'No tienes permisos para acceder a este recurso',
      403
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debe permitir solo rol user cuando se especifica', () => {
    // ARRANGE - Usuario con rol admin intentando acceder a ruta de user
    req.user = {
      id: 'admin-123',
      role: 'admin'
    };

    const middleware = authorize('user');

    // ACT
    middleware(req, res, next);

    // ASSERT
    // Admin NO tiene acceso a rutas solo de user
    expect(next).not.toHaveBeenCalled();
  });

  it('debe funcionar con array de roles permitidos', () => {
    // ARRANGE
    req.user = {
      id: 'user-123',
      role: 'admin'
    };

    const middleware = authorize('user', 'admin', 'moderator');

    // ACT
    middleware(req, res, next);

    // ASSERT
    expect(next).toHaveBeenCalled();
  });

  it('debe rechazar si rol no está en la lista de permitidos', () => {
    // ARRANGE
    req.user = {
      id: 'user-123',
      role: 'guest'
    };

    const middleware = authorize('user', 'admin');
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    middleware(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalledWith(
      res,
      'No tienes permisos para acceder a este recurso',
      403
    );
  });

  it('debe ser case-sensitive con los roles', () => {
    // ARRANGE
    req.user = {
      id: 'user-123',
      role: 'Admin' // Mayúscula
    };

    const middleware = authorize('admin'); // Minúscula
    errorResponse.mockImplementation((res, message, status) => {
      res.status(status).json({ error: message });
    });

    // ACT
    middleware(req, res, next);

    // ASSERT
    expect(errorResponse).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });

  it('debe retornar una función middleware', () => {
    // ACT
    const middleware = authorize('admin');

    // ASSERT
    expect(typeof middleware).toBe('function');
    expect(middleware.length).toBe(3); // req, res, next
  });
});