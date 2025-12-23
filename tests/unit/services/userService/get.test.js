// test/unit/services/userService/get.test.js
const userService = require('../../../../src/services/userService');
const { User } = require('../../../../src/models');
const { executeQuery } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('UserService - Get Users', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    
    it('debe obtener usuario por ID correctamente', async () => {
      // ARRANGE
      const userId = 'user-123';
      const mockUser = {
        id: userId,
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        isActive: true,
        toJSON: jest.fn().mockReturnValue({
          id: userId,
          name: 'Test User',
          email: 'test@example.com',
          role: 'user'
        })
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // ACT
      const result = await userService.getUserById(userId);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(userId);
      expect(result.data.name).toBe('Test User');
      expect(User.findByPk).toHaveBeenCalledWith(userId, {
        attributes: { exclude: ['password'] }
      });
    });

    it('debe excluir password del resultado', async () => {
      // ARRANGE
      const mockUser = {
        id: 'user-123',
        toJSON: jest.fn().mockReturnValue({
          id: 'user-123',
          name: 'Test'
        })
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // ACT
      await userService.getUserById('user-123');

      // ASSERT
      expect(User.findByPk).toHaveBeenCalledWith('user-123', {
        attributes: { exclude: ['password'] }
      });
    });

    it('debe lanzar error si usuario no existe', async () => {
      // ARRANGE
      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Usuario no encontrado');
      });

      User.findByPk = jest.fn().mockResolvedValue(null);

      // ACT & ASSERT
      await expect(userService.getUserById('user-999'))
        .rejects
        .toThrow('Usuario no encontrado');
    });

    it('debe convertir usuario a JSON antes de retornar', async () => {
      // ARRANGE
      const mockUser = {
        id: 'user-123',
        toJSON: jest.fn().mockReturnValue({ id: 'user-123', name: 'Test' })
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      User.findByPk = jest.fn().mockResolvedValue(mockUser);

      // ACT
      const result = await userService.getUserById('user-123');

      // ASSERT
      expect(mockUser.toJSON).toHaveBeenCalled();
      expect(result.data).toEqual({ id: 'user-123', name: 'Test' });
    });
  });

  describe('getUserByEmail', () => {
    
    it('debe obtener usuario por email correctamente', async () => {
      // ARRANGE
      const email = 'test@example.com';
      const mockUser = {
        id: 'user-123',
        email: email,
        name: 'Test User',
        toJSON: jest.fn().mockReturnValue({
          id: 'user-123',
          email: email,
          name: 'Test User'
        })
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // ACT
      const result = await userService.getUserByEmail(email);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.data.email).toBe(email);
      expect(User.findOne).toHaveBeenCalledWith({
        where: { email },
        attributes: { exclude: ['password'] }
      });
    });

    it('debe excluir password del resultado', async () => {
      // ARRANGE
      const mockUser = {
        id: 'user-123',
        toJSON: jest.fn().mockReturnValue({ id: 'user-123' })
      };

      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      User.findOne = jest.fn().mockResolvedValue(mockUser);

      // ACT
      await userService.getUserByEmail('test@example.com');

      // ASSERT
      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          attributes: { exclude: ['password'] }
        })
      );
    });

    it('debe lanzar error si usuario no existe', async () => {
      // ARRANGE
      executeQuery.mockImplementation(async (queryLogic) => {
        await queryLogic();
        throw new Error('Usuario no encontrado');
      });

      User.findOne = jest.fn().mockResolvedValue(null);

      // ACT & ASSERT
      await expect(userService.getUserByEmail('noexiste@example.com'))
        .rejects
        .toThrow('Usuario no encontrado');
    });

    it('debe buscar por email exacto', async () => {
      // ARRANGE
      const email = 'specific@example.com';
      
      executeQuery.mockImplementation(async (queryLogic) => {
        const result = await queryLogic();
        return { success: true, data: result };
      });

      User.findOne = jest.fn().mockResolvedValue({
        toJSON: jest.fn().mockReturnValue({ id: 'user-123' })
      });

      // ACT
      await userService.getUserByEmail(email);

      // ASSERT
      expect(User.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { email: email }
        })
      );
    });
  });
});