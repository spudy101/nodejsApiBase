// test/unit/middlewares/requestLock.test.js
const { 
  requestLock, 
  getRequestLockStats, 
  clearRequestStore, 
  stopCleanupInterval 
} = require('../../../src/middlewares/requestLock');
const { errorResponse } = require('../../../src/utils/responseHandler');

jest.mock('../../../src/utils/responseHandler');
jest.mock('../../../src/utils/logger');

describe('RequestLock Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    clearRequestStore(); // ← Limpiar el store antes de cada test
    
    req = {
      method: 'POST',
      path: '/api/products',
      body: { name: 'Test Product', price: 100 },
      user: {
        id: 'user-123'
      }
    };
    res = {
      on: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  afterAll(() => {
    stopCleanupInterval(); // ← Detener interval al final de todos los tests
    clearRequestStore();
  });

  describe('métodos permitidos', () => {
    
    it('debe permitir GET sin bloqueo', () => {
      // ARRANGE
      req.method = 'GET';
      const middleware = requestLock();

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
      expect(errorResponse).not.toHaveBeenCalled();
    });

    it('debe bloquear POST', () => {
      // ARRANGE
      req.method = 'POST';
      const middleware = requestLock();

      // Primera request
      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Segunda request idéntica inmediatamente
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalledWith(
        res,
        'Petición duplicada en proceso, por favor espera',
        409
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('debe bloquear PUT', () => {
      // ARRANGE
      req.method = 'PUT';
      const middleware = requestLock();

      // Primera request
      middleware(req, res, next);

      // Segunda request idéntica
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
    });

    it('debe bloquear PATCH', () => {
      // ARRANGE
      req.method = 'PATCH';
      const middleware = requestLock();

      // Primera request
      middleware(req, res, next);

      // Segunda request idéntica
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
    });

    it('debe bloquear DELETE', () => {
      // ARRANGE
      req.method = 'DELETE';
      const middleware = requestLock();

      // Primera request
      middleware(req, res, next);

      // Segunda request idéntica
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
    });
  });

  describe('generación de keys únicas', () => {
    
    it('debe generar keys diferentes para usuarios diferentes', () => {
      // ARRANGE
      const middleware = requestLock();

      // Usuario 1
      req.user.id = 'user-123';
      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Usuario 2 - misma request pero diferente usuario
      jest.clearAllMocks();
      req.user.id = 'user-456';
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled(); // No debe bloquear
      expect(errorResponse).not.toHaveBeenCalled();
    });

    it('debe generar keys diferentes para paths diferentes', () => {
      // ARRANGE
      const middleware = requestLock();

      // Path 1
      req.path = '/api/products';
      middleware(req, res, next);

      // Path 2
      jest.clearAllMocks();
      req.path = '/api/users';
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalledTimes(1);
      expect(errorResponse).not.toHaveBeenCalled();
    });

    it('debe generar keys diferentes para métodos diferentes', () => {
      // ARRANGE
      const middleware = requestLock();

      // POST
      req.method = 'POST';
      middleware(req, res, next);

      // PUT - mismo path y body
      jest.clearAllMocks();
      req.method = 'PUT';
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalledTimes(1);
      expect(errorResponse).not.toHaveBeenCalled();
    });

    it('debe generar keys diferentes para body diferentes', () => {
      // ARRANGE
      const middleware = requestLock();

      // Body 1
      req.body = { name: 'Product A', price: 100 };
      middleware(req, res, next);

      // Body 2
      jest.clearAllMocks();
      req.body = { name: 'Product B', price: 200 };
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalledTimes(1);
      expect(errorResponse).not.toHaveBeenCalled();
    });

    it('debe generar la misma key para requests idénticas', () => {
      // ARRANGE
      const middleware = requestLock();

      // Primera request
      middleware(req, res, next);

      // Segunda request idéntica
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('debe manejar usuarios anónimos', () => {
      // ARRANGE
      req.user = null;
      const middleware = requestLock();

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });
  });

  describe('timeout y expiración', () => {
    
    it('debe usar timeout por defecto de 5 segundos', () => {
      // ARRANGE
      const middleware = requestLock();

      // Primera request
      middleware(req, res, next);

      // Segunda request inmediata (dentro de 5 segundos)
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
    });

    it('debe permitir request después del timeout', () => {
      // ARRANGE
      const middleware = requestLock({ timeout: 5000 });

      // Primera request
      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Avanzar tiempo más allá del timeout
      jest.advanceTimersByTime(6000);

      // Segunda request después del timeout
      jest.clearAllMocks();
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
      expect(errorResponse).not.toHaveBeenCalled();
    });

    it('debe respetar timeout personalizado', () => {
      // ARRANGE
      const customTimeout = 10000;
      const middleware = requestLock({ timeout: customTimeout });

      // Primera request
      middleware(req, res, next);

      // Avanzar 5 segundos (menos que el timeout)
      jest.advanceTimersByTime(5000);
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      // Segunda request - aún dentro del timeout
      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();

      // Avanzar otros 6 segundos (total 11 segundos)
      jest.advanceTimersByTime(6000);
      jest.clearAllMocks();

      // Tercera request - después del timeout
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });

    it('debe bloquear request dentro del timeout', () => {
      // ARRANGE
      const middleware = requestLock({ timeout: 5000 });

      // Primera request
      middleware(req, res, next);

      // Avanzar 2 segundos (dentro del timeout)
      jest.advanceTimersByTime(2000);
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      // Segunda request
      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('mensaje personalizado', () => {
    
    it('debe usar mensaje por defecto', () => {
      // ARRANGE
      const middleware = requestLock();

      // Primera request
      middleware(req, res, next);

      // Segunda request
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalledWith(
        res,
        'Petición duplicada en proceso, por favor espera',
        409
      );
    });

    it('debe usar mensaje personalizado', () => {
      // ARRANGE
      const customMessage = 'Ya hay una operación en proceso';
      const middleware = requestLock({ message: customMessage });

      // Primera request
      middleware(req, res, next);

      // Segunda request
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalledWith(
        res,
        customMessage,
        409
      );
    });
  });

  describe('cleanup de requests', () => {
    
    it('debe limpiar lock cuando request termina (finish)', () => {
      // ARRANGE
      const middleware = requestLock();
      let finishCallback;

      res.on = jest.fn((event, callback) => {
        if (event === 'finish') {
          finishCallback = callback;
        }
      });

      // Primera request
      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Simular que la request terminó
      finishCallback();

      // Segunda request - debe permitir porque ya se limpió
      jest.clearAllMocks();
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
      expect(errorResponse).not.toHaveBeenCalled();
    });

    it('debe limpiar lock cuando request se cierra (close)', () => {
      // ARRANGE
      const middleware = requestLock();
      let closeCallback;

      res.on = jest.fn((event, callback) => {
        if (event === 'close') {
          closeCallback = callback;
        }
      });

      // Primera request
      middleware(req, res, next);

      // Simular que la conexión se cerró
      closeCallback();

      // Segunda request - debe permitir
      jest.clearAllMocks();
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });

    it('debe registrar eventos finish y close', () => {
      // ARRANGE
      const middleware = requestLock();

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(res.on).toHaveBeenCalledWith('close', expect.any(Function));
    });
  });

  describe('getRequestLockStats', () => {
    
    it('debe retornar estadísticas de requests activas', () => {
      // ARRANGE
      const middleware = requestLock();

      // Crear algunas requests
      middleware(req, res, next);

      req.user.id = 'user-456';
      middleware(req, res, next);

      // ACT
      const stats = getRequestLockStats();

      // ASSERT
      expect(stats).toHaveProperty('activeRequests');
      expect(stats).toHaveProperty('requests');
      expect(stats.activeRequests).toBeGreaterThan(0);
      expect(Array.isArray(stats.requests)).toBe(true);
    });

    it('debe retornar 0 requests activas si no hay ninguna', () => {
      // ACT
      const stats = getRequestLockStats();

      // ASSERT
      expect(stats.activeRequests).toBe(0);
      expect(stats.requests).toEqual([]);
    });

    it('debe incluir información de edad de requests', () => {
      // ARRANGE
      const middleware = requestLock();
      middleware(req, res, next);

      jest.advanceTimersByTime(1000);

      // ACT
      const stats = getRequestLockStats();

      // ASSERT
      expect(stats.requests[0]).toHaveProperty('age');
      expect(stats.requests[0].age).toBeGreaterThanOrEqual(1000);
    });

    it('debe incluir userId, method y path en stats', () => {
      // ARRANGE
      const middleware = requestLock();
      middleware(req, res, next);

      // ACT
      const stats = getRequestLockStats();

      // ASSERT
      expect(stats.requests[0]).toHaveProperty('userId', 'user-123');
      expect(stats.requests[0]).toHaveProperty('method', 'POST');
      expect(stats.requests[0]).toHaveProperty('path', '/api/products');
    });
  });

  describe('casos especiales', () => {
    
    it('debe manejar body vacío', () => {
      // ARRANGE
      req.body = {};
      const middleware = requestLock();

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });

    it('debe manejar body null', () => {
      // ARRANGE
      req.body = null;
      const middleware = requestLock();

      // ACT
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
    });

    it('debe manejar path con query params', () => {
      // ARRANGE
      req.path = '/api/products?sort=name&order=asc';
      const middleware = requestLock();

      // Primera request
      middleware(req, res, next);

      // Segunda request con mismos query params
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
    });

    it('debe manejar body con objetos anidados', () => {
      // ARRANGE
      req.body = {
        product: {
          name: 'Test',
          details: {
            color: 'red',
            size: 'large'
          }
        }
      };
      const middleware = requestLock();

      // Primera request
      middleware(req, res, next);

      // Segunda request idéntica
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
    });
  });

  describe('múltiples usuarios concurrentes', () => {
    
    it('debe permitir diferentes usuarios hacer la misma request', () => {
      // ARRANGE
      const middleware = requestLock();

      // Usuario 1
      req.user.id = 'user-1';
      middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Usuario 2 - misma request
      jest.clearAllMocks();
      req.user.id = 'user-2';
      middleware(req, res, next);

      // ASSERT
      expect(next).toHaveBeenCalled();
      expect(errorResponse).not.toHaveBeenCalled();
    });

    it('debe bloquear requests duplicadas del mismo usuario', () => {
      // ARRANGE
      const middleware = requestLock();

      // Usuario 1 - primera request
      req.user.id = 'user-1';
      middleware(req, res, next);

      // Usuario 1 - segunda request idéntica
      jest.clearAllMocks();
      errorResponse.mockImplementation((res, message, status) => {
        res.status(status).json({ error: message });
      });

      middleware(req, res, next);

      // ASSERT
      expect(errorResponse).toHaveBeenCalled();
    });
  });
});