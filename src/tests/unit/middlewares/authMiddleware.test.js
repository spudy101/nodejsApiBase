// tests/unit/middlewares/authMiddleware.test.js
const jwt = require('jsonwebtoken');
const { verificarAutenticacion, verificarTimestamp } = require('../../../src/middlewares/authMiddleware');
const { obtenerDatosUsuarioPorToken } = require('../../../src/utils/datosUtils');
const { desencriptarMensaje } = require('../../../src/utils/cryptoUtils');

// Mocks
jest.mock('../../../src/utils/datosUtils');
jest.mock('../../../src/utils/cryptoUtils');
jest.mock('jsonwebtoken');

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      cookies: {},
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('verificarAutenticacion', () => {
    it('debería rechazar request sin token', async () => {
      await verificarAutenticacion(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No autorizado. Token no proporcionado',
        code: 'AUTH_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería rechazar token JWT inválido', async () => {
      req.cookies.jwtToken = 'invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await verificarAutenticacion(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    it('debería rechazar si no hay datos de usuario', async () => {
      req.cookies.jwtToken = 'valid-jwt-token';
      jwt.verify.mockReturnValue({ token: 'user-token' });
      obtenerDatosUsuarioPorToken.mockResolvedValue({
        success: false,
        data: null
      });

      await verificarAutenticacion(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No autorizado. Sesión inválida o expirada',
        code: 'INVALID_SESSION'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería permitir request con token válido', async () => {
      const mockUserData = {
        id_usuario: 1,
        nombres: 'Test',
        token: 'user-token'
      };

      req.cookies.jwtToken = 'valid-jwt-token';
      jwt.verify.mockReturnValue({ token: 'user-token' });
      obtenerDatosUsuarioPorToken.mockResolvedValue({
        success: true,
        data: mockUserData
      });

      await verificarAutenticacion(req, res, next);

      expect(req.usuario).toEqual(mockUserData);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería manejar errores internos', async () => {
      req.cookies.jwtToken = 'valid-jwt-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Internal error');
      });

      await verificarAutenticacion(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        message: 'Error interno del servidor'
      }));
    });
  });

  describe('verificarTimestamp', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('debería rechazar request sin timestamp', async () => {
      await verificarTimestamp(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No autorizado. timestamp no proporcionado',
        code: 'AUTH_REQUIRED'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('debería rechazar timestamp inválido', async () => {
      req.headers.timestamp = 'encrypted-timestamp';
      desencriptarMensaje.mockReturnValue(null);

      await verificarTimestamp(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Timestamp inválido o corrupto',
        code: 'INVALID_TIMESTAMP'
      });
    });

    it('debería rechazar timestamp con formato incorrecto', async () => {
      req.headers.timestamp = 'encrypted-timestamp';
      desencriptarMensaje.mockReturnValue('not-a-number');

      await verificarTimestamp(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Formato de timestamp inválido',
        code: 'INVALID_TIMESTAMP_FORMAT'
      });
    });

    it('debería rechazar timestamp expirado (> 1 minuto)', async () => {
      const oldTimestamp = Date.now() - (61 * 1000); // 61 segundos atrás
      req.headers.timestamp = 'encrypted-timestamp';
      desencriptarMensaje.mockReturnValue(oldTimestamp.toString());

      await verificarTimestamp(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Timestamp expirado. La solicitud debe realizarse dentro de 1 minuto',
        code: 'TIMESTAMP_EXPIRED'
      });
    });

    it('debería aceptar timestamp válido (< 1 minuto)', async () => {
      const validTimestamp = Date.now() - (30 * 1000); // 30 segundos atrás
      req.headers.timestamp = 'encrypted-timestamp';
      desencriptarMensaje.mockReturnValue(validTimestamp.toString());

      await verificarTimestamp(req, res, next);

      expect(req.timestampValidado).toBe(validTimestamp);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('debería aceptar timestamp actual', async () => {
      const currentTimestamp = Date.now();
      req.headers.timestamp = 'encrypted-timestamp';
      desencriptarMensaje.mockReturnValue(currentTimestamp.toString());

      await verificarTimestamp(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
