// test/unit/services/authService/login.test.js
const authService = require('../../../../src/services/authService');
const { User, LoginAttempts } = require('../../../../src/models');
const { generateToken } = require('../../../../src/utils/jwtHelper');
const { executeQuery } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/jwtHelper');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('AuthService - Login', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login exitoso', () => {
    
    it('debe permitir login con credenciales correctas', async () => {
      // ARRANGE
      const email = 'usuario@empresa.com';
      const password = 'MiPassword123';
      
      const mockUser = {
        id: 'user-123',
        email: email,
        isActive: true,
        role: 'user',
        lastLogin: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn(),
        toJSON: jest.fn().mockReturnValue({
          id: 'user-123',
          email: email,
          name: 'Usuario Test',
          role: 'user'
        })
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(null);
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token-valid');

      // ACT
      const result = await authService.login(email, password);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe(email);
      expect(result.data.token).toBe('token-valid');
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email } });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(password);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('debe actualizar lastLogin al hacer login exitoso', async () => {
      // ARRANGE
      const email = 'usuario@empresa.com';
      const mockUser = {
        id: 'user-123',
        email: email,
        isActive: true,
        lastLogin: null,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn(),
        toJSON: jest.fn().mockReturnValue({ id: 'user-123' })
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(null);
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      // ACT
      await authService.login(email, 'password');

      // ASSERT
      expect(mockUser.lastLogin).not.toBeNull();
      expect(mockUser.lastLogin).toBeInstanceOf(Date);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('debe resetear intentos fallidos a 0 después de login exitoso', async () => {
      // ARRANGE
      const mockLoginAttempt = {
        email: 'usuario@empresa.com',
        attempts: 3,
        blockedUntil: new Date(),
        save: jest.fn()
      };

      const mockUser = {
        id: 'user-123',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn(),
        toJSON: jest.fn().mockReturnValue({ id: 'user-123' })
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(mockLoginAttempt);
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      generateToken.mockReturnValue('token');

      // ACT
      await authService.login('usuario@empresa.com', 'password');

      // ASSERT
      expect(mockLoginAttempt.attempts).toBe(0);
      expect(mockLoginAttempt.blockedUntil).toBeNull();
      expect(mockLoginAttempt.save).toHaveBeenCalled();
    });
  });

  describe('login fallido', () => {
    
    it('debe rechazar login con password incorrecta', async () => {
      // ARRANGE
      const email = 'usuario@empresa.com';
      const wrongPassword = 'PasswordIncorrecta';
      
      const mockUser = {
        id: 'user-123',
        email: email,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Credenciales inválidas');
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(null);
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // ACT & ASSERT
      await expect(authService.login(email, wrongPassword))
        .rejects
        .toThrow('Credenciales inválidas');
      
      expect(mockUser.comparePassword).toHaveBeenCalledWith(wrongPassword);
    });

    it('debe rechazar login si usuario no existe', async () => {
      // ARRANGE
      const email = 'noexiste@empresa.com';
      const password = 'cualquiera';

      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Credenciales inválidas');
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(null);
      LoginAttempts.create = jest.fn();
      User.findOne = jest.fn().mockResolvedValue(null);

      // ACT & ASSERT
      await expect(authService.login(email, password))
        .rejects
        .toThrow('Credenciales inválidas');
      
      expect(User.findOne).toHaveBeenCalledWith({ where: { email } });
    });

    it('debe rechazar login si usuario está inactivo', async () => {
      // ARRANGE
      const mockUser = {
        id: 'user-123',
        email: 'inactivo@empresa.com',
        isActive: false
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Usuario inactivo');
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(null);
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // ACT & ASSERT
      await expect(authService.login('inactivo@empresa.com', 'password'))
        .rejects
        .toThrow('Usuario inactivo');
    });

    it('debe incrementar contador de intentos fallidos', async () => {
      // ARRANGE
      const mockLoginAttempt = {
        email: 'usuario@empresa.com',
        attempts: 2,
        blockedUntil: null,
        save: jest.fn()
      };

      const mockUser = {
        id: 'user-123',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Credenciales inválidas');
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(mockLoginAttempt);
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // ACT
      try {
        await authService.login('usuario@empresa.com', 'wrongpass');
      } catch (error) {
        // Expected
      }

      // ASSERT
      expect(mockLoginAttempt.attempts).toBe(3);
      expect(mockLoginAttempt.save).toHaveBeenCalled();
    });
  });

  describe('bloqueo de cuenta', () => {
    
    it('debe bloquear cuenta después de 5 intentos fallidos', async () => {
      // ARRANGE
      const email = 'usuario@empresa.com';
      
      const mockUser = {
        id: 'user-123',
        email: email,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      const mockLoginAttempt = {
        email: email,
        attempts: 4,
        blockedUntil: null,
        save: jest.fn()
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Credenciales inválidas');
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(mockLoginAttempt);
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // ACT
      try {
        await authService.login(email, 'wrongpass');
      } catch (error) {
        // Expected
      }

      // ASSERT
      expect(mockLoginAttempt.attempts).toBe(5);
      expect(mockLoginAttempt.blockedUntil).not.toBeNull();
      expect(mockLoginAttempt.blockedUntil).toBeInstanceOf(Date);
      expect(mockLoginAttempt.save).toHaveBeenCalled();
    });

    it('debe rechazar login si cuenta está bloqueada', async () => {
      // ARRANGE
      const email = 'bloqueado@empresa.com';
      const futureDate = new Date(Date.now() + 10 * 60000);

      const mockLoginAttempt = {
        email: email,
        attempts: 5,
        blockedUntil: futureDate
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Cuenta bloqueada temporalmente. Intenta nuevamente en 10 minutos.');
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(mockLoginAttempt);

      // ACT & ASSERT
      await expect(authService.login(email, 'cualquier-password'))
        .rejects
        .toThrow(/Cuenta bloqueada temporalmente/);
    });

    it('debe bloquear por 15 minutos después de 5 intentos', async () => {
      // ARRANGE
      const mockLoginAttempt = {
        email: 'usuario@empresa.com',
        attempts: 4,
        blockedUntil: null,
        save: jest.fn()
      };

      const mockUser = {
        id: 'user-123',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Credenciales inválidas');
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(mockLoginAttempt);
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      const beforeLogin = Date.now();

      // ACT
      try {
        await authService.login('usuario@empresa.com', 'wrongpass');
      } catch (error) {
        // Expected
      }

      const afterLogin = Date.now();

      // ASSERT
      const blockedTime = mockLoginAttempt.blockedUntil.getTime();
      const expectedBlockTime = 15 * 60 * 1000; // 15 minutos
      
      expect(blockedTime - beforeLogin).toBeGreaterThanOrEqual(expectedBlockTime - 1000);
      expect(blockedTime - afterLogin).toBeLessThanOrEqual(expectedBlockTime + 1000);
    });

    it('debe crear registro de LoginAttempts si no existe', async () => {
      // ARRANGE
      const mockUser = {
        id: 'user-123',
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false)
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Credenciales inválidas');
      });

      LoginAttempts.findOne = jest.fn().mockResolvedValue(null);
      LoginAttempts.create = jest.fn().mockResolvedValue({
        email: 'nuevo@empresa.com',
        attempts: 1,
        ipAddress: null
      });
      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // ACT
      try {
        await authService.login('nuevo@empresa.com', 'wrongpass');
      } catch (error) {
        // Expected
      }

      // ASSERT
      expect(LoginAttempts.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'nuevo@empresa.com',
          attempts: 1
        })
      );
    });
  });
});