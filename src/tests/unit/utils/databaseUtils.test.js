// tests/unit/utils/databaseUtils.test.js
const { executeQuery, executeWithTransaction } = require('../../../src/utils/databaseUtils');
const db = require('../../../src/models');

// Mock de Sequelize
jest.mock('../../../src/models', () => ({
  sequelize: {
    transaction: jest.fn(),
    Transaction: {
      ISOLATION_LEVELS: {
        REPEATABLE_READ: 'REPEATABLE_READ'
      }
    }
  },
  Sequelize: {}
}));

describe('databaseUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeQuery', () => {
    it('debería ejecutar query exitosamente', async () => {
      const queryParams = { id: 1 };
      const mockResult = { id: 1, name: 'Test' };
      const queryLogic = jest.fn().mockResolvedValue(mockResult);
      
      const result = await executeQuery(queryParams, queryLogic, 'TEST_QUERY');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(result.count).toBe(1);
      expect(queryLogic).toHaveBeenCalledWith(queryParams);
    });

    it('debería manejar errores correctamente', async () => {
      const queryParams = { id: 1 };
      const error = new Error('Database error');
      const queryLogic = jest.fn().mockRejectedValue(error);
      
      const result = await executeQuery(queryParams, queryLogic, 'TEST_QUERY');
      
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(result.message).toBe('Database error');
      expect(result.count).toBe(0);
    });

    it('debería contar correctamente arrays', async () => {
      const mockResult = [1, 2, 3, 4, 5];
      const queryLogic = jest.fn().mockResolvedValue(mockResult);
      
      const result = await executeQuery({}, queryLogic, 'TEST_QUERY');
      
      expect(result.count).toBe(5);
    });

    it('debería contar 0 para null/undefined', async () => {
      const queryLogic = jest.fn().mockResolvedValue(null);
      
      const result = await executeQuery({}, queryLogic, 'TEST_QUERY');
      
      expect(result.count).toBe(0);
    });

    it('debería incluir execution time', async () => {
      const queryLogic = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('data'), 50))
      );
      
      const result = await executeQuery({}, queryLogic, 'TEST_QUERY');
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(typeof result.executionTime).toBe('number');
    });
  });

  describe('executeWithTransaction', () => {
    it('debería ejecutar transacción exitosamente', async () => {
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true)
      };
      
      db.sequelize.transaction.mockResolvedValue(mockTransaction);
      
      const inputData = { name: 'Test' };
      const mockResult = { id: 1, name: 'Test' };
      const businessLogic = jest.fn().mockResolvedValue(mockResult);
      
      const result = await executeWithTransaction(inputData, businessLogic, 'TEST_OPERATION');
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(mockTransaction.rollback).not.toHaveBeenCalled();
    });

    it('debería hacer rollback en caso de error', async () => {
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true)
      };
      
      db.sequelize.transaction.mockResolvedValue(mockTransaction);
      
      const error = new Error('Business logic error');
      const businessLogic = jest.fn().mockRejectedValue(error);
      
      const result = await executeWithTransaction({}, businessLogic, 'TEST_OPERATION');
      
      expect(result.success).toBe(false);
      expect(result.data).toBeNull();
      expect(mockTransaction.rollback).toHaveBeenCalled();
      expect(mockTransaction.commit).not.toHaveBeenCalled();
    });

    it('debería incluir execution time', async () => {
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true)
      };
      
      db.sequelize.transaction.mockResolvedValue(mockTransaction);
      
      const businessLogic = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve('data'), 50))
      );
      
      const result = await executeWithTransaction({}, businessLogic, 'TEST_OPERATION');
      
      expect(result.executionTime).toBeGreaterThan(0);
      expect(typeof result.executionTime).toBe('number');
    });

    it('debería pasar inputData y transaction a businessLogic', async () => {
      const mockTransaction = {
        commit: jest.fn().mockResolvedValue(true),
        rollback: jest.fn().mockResolvedValue(true)
      };
      
      db.sequelize.transaction.mockResolvedValue(mockTransaction);
      
      const inputData = { test: 'data' };
      const businessLogic = jest.fn().mockResolvedValue('result');
      
      await executeWithTransaction(inputData, businessLogic, 'TEST_OPERATION');
      
      expect(businessLogic).toHaveBeenCalledWith(inputData, mockTransaction);
    });
  });
});
