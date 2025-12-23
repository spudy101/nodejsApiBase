// test/unit/services/authService/profile.test.js
const authService = require('../../../../src/services/authService');
const { User } = require('../../../../src/models');
const { executeQuery, executeWithTransaction } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('AuthService - Profile Management', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    
    it('debe obtener perfil de usuario correctamente', async () => {
      // ARRANGE
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
        isActive: true,
        toJSON: jest.fn().mockReturnValue({
          id: userId,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        })
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // ACT
      const result = await authService.getProfile(userId);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.data.email).toBe('test@example.com');
      expect(User.findByPk).toHaveBeenCalledWith(userId, {
        attributes: { exclude: ['password'] }
      });
    });

    it('debe excluir password del perfil', async () => {
      // ARRANGE
      const mockUser = {
        id: 'user-123',
        toJSON: jest.fn().mockReturnValue({
          id: 'user-123',
          email: 'test@example.com'
        })
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // ACT
      const result = await authService.getProfile('user-123');

      // ASSERT
      expect(result.data).not.toHaveProperty('password');
    });

    it('debe lanzar error si usuario no existe', async () => {
      // ARRANGE
      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Usuario no encontrado');
      });

      User.findByPk = jest.fn().mockResolvedValue(null);

      // ACT & ASSERT
      await expect(authService.getProfile('user-999'))
        .rejects
        .toThrow('Usuario no encontrado');
    });
  });

  describe('updateProfile', () => {
    
    it('debe actualizar nombre y email correctamente', async () => {
      // ARRANGE
      const userId = 'user-123';
      const updateData = {
        name: 'Nuevo Nombre',
        email: 'nuevo@example.com'
      };

      const mockUser = {
        id: userId,
        name: 'Nombre Viejo',
        email: 'viejo@example.com',
        save: jest.fn(),
        toJSON: jest.fn().mockReturnValue({
          id: userId,
          name: updateData.name,
          email: updateData.email
        })
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // ACT
      const result = await authService.updateProfile(userId, updateData);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockUser.name).toBe(updateData.name);
      expect(mockUser.email).toBe(updateData.email);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('debe actualizar solo el nombre si email no se proporciona', async () => {
      // ARRANGE
      const mockUser = {
        id: 'user-123',
        name: 'Nombre Viejo',
        email: 'email@example.com',
        save: jest.fn(),
        toJSON: jest.fn().mockReturnValue({ id: 'user-123' })
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // ACT
      await authService.updateProfile('user-123', { name: 'Nuevo Nombre' });

      // ASSERT
      expect(mockUser.name).toBe('Nuevo Nombre');
      expect(mockUser.email).toBe('email@example.com');
    });

    it('debe rechazar actualización si usuario no existe', async () => {
      // ARRANGE
      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return result;
      });

      User.findByPk = jest.fn().mockResolvedValue(null);

      // ACT
      const result = await authService.updateProfile('user-999', { name: 'Test' });

      // ASSERT
      expect(result._rollback).toBe(true);
      expect(result.message).toBe('Usuario no encontrado');
    });
  });

  describe('deactivateUser', () => {
    
    it('debe desactivar usuario exitosamente', async () => {
      // ARRANGE
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        isActive: true,
        save: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // ACT
      const result = await authService.deactivateUser(userId);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockUser.isActive).toBe(false);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('debe rechazar si usuario no existe', async () => {
      // ARRANGE
      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return result;
      });

      User.findByPk = jest.fn().mockResolvedValue(null);

      // ACT
      const result = await authService.deactivateUser('user-999');

      // ASSERT
      expect(result._rollback).toBe(true);
      expect(result.message).toBe('Usuario no encontrado');
    });
  });

  describe('activateUser', () => {
    
    it('debe activar usuario exitosamente', async () => {
      // ARRANGE
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        isActive: false,
        save: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // ACT
      const result = await authService.activateUser(userId);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockUser.isActive).toBe(true);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('debe rechazar si usuario no existe', async () => {
      // ARRANGE
      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return result;
      });

      User.findByPk = jest.fn().mockResolvedValue(null);

      // ACT
      const result = await authService.activateUser('user-999');

      // ASSERT
      expect(result._rollback).toBe(true);
      expect(result.message).toBe('Usuario no encontrado');
    });
  });
});