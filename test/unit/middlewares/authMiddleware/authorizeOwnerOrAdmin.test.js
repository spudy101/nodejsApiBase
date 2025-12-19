// test/unit/middlewares/authMiddleware/authorizeOwnerOrAdmin.test.js
const { authorizeOwnerOrAdmin } = require('../../../../src/middlewares/authMiddleware');
const { errorResponse } = require('../../../../src/utils/responseHandler');

jest.mock('../../../../src/utils/responseHandler');
jest.mock('../../../../src/utils/logger');

describe('AuthMiddleware - AuthorizeOwnerOrAdmin', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      params: {},
      body: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('con parámetro por defecto (userId)', () => {
    
    it('debe permitir acceso si usuario es el owner', () => {
      // ARRANGE
      req.user = {
        id: 'user-123',
        role: 'user'
      };
      req.params.userId = 'user-123';

      const middleware = authorizeOwnerOrAdmin();

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
      expect(errorResponse).not.toHaveBeenCalled();
    });

    it('debe permitir acceso si usuario es admin', () => {
      // ARRANGE
      req.user = {
        id: 'admin-456',
        role: 'admin'
      };
      req.params.userId = 'user-123'; // Diferente al admin

      const middleware = authorizeOwnerOrAdmin();

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });

    it('debe rechazar si no es owner ni admin', () => {
      // ARRANGE
      req.user = {
        id: 'user-999',
        role: 'user'
      };
      req.params.userId = 'user-123'; // Diferente usuario

      const middleware = authorizeOwnerOrAdmin();
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
  });

  describe('con parámetro personalizado', () => {
    
    it('debe usar parámetro personalizado de params', () => {
      // ARRANGE
      req.user = {
        id: 'user-123',
        role: 'user'
      };
      req.params.id = 'user-123'; // Parámetro personalizado

      const middleware = authorizeOwnerOrAdmin('id');

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });

    it('debe usar parámetro personalizado de body', () => {
      // ARRANGE
      req.user = {
        id: 'user-123',
        role: 'user'
      };
      req.body.authorId = 'user-123'; // En body

      const middleware = authorizeOwnerOrAdmin('authorId');

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });

    it('debe priorizar params sobre body', () => {
      // ARRANGE
      req.user = {
        id: 'user-123',
        role: 'user'
      };
      req.params.ownerId = 'user-123';
      req.body.ownerId = 'user-999'; // Diferente

      const middleware = authorizeOwnerOrAdmin('ownerId');

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });
  });

  describe('casos especiales', () => {
    
    it('debe permitir a admin acceder a cualquier recurso', () => {
      // ARRANGE
      req.user = {
        id: 'admin-789',
        role: 'admin'
      };
      req.params.userId = 'cualquier-usuario';

      const middleware = authorizeOwnerOrAdmin();

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });

    it('debe rechazar a user regular accediendo a recurso de otro', () => {
      // ARRANGE
      req.user = {
        id: 'user-111',
        role: 'user'
      };
      req.params.userId = 'user-222';

      const middleware = authorizeOwnerOrAdmin();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('debe manejar undefined resourceUserId', () => {
      // ARRANGE
      req.user = {
        id: 'user-123',
        role: 'user'
      };
      // No se proporciona userId

      const middleware = authorizeOwnerOrAdmin();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
    });

    it('debe comparar IDs como strings', () => {
      // ARRANGE
      req.user = {
        id: 'user-123',
        role: 'user'
      };
      req.params.userId = 'user-123'; // String

      const middleware = authorizeOwnerOrAdmin();

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });
  });

  describe('validación de roles', () => {
    
    it('debe validar que admin tiene rol "admin"', () => {
      // ARRANGE
      req.user = {
        id: 'user-456',
        role: 'Admin' // Mayúscula, no debería funcionar
      };
      req.params.userId = 'user-123';

      const middleware = authorizeOwnerOrAdmin();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('debe funcionar solo con rol exacto "admin"', () => {
      // ARRANGE
      req.user = {
        id: 'moderator-789',
        role: 'moderator' // No es admin
      };
      req.params.userId = 'user-123';

      const middleware = authorizeOwnerOrAdmin();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
    });
  });
});