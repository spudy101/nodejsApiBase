// test/unit/services/productService/stock.test.js
const productService = require('../../../../src/services/productService');
const { Product, sequelize } = require('../../../../src/models');
const { executeWithTransaction } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('ProductService - Update Stock (CRÍTICO)', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('operación ADD', () => {
    
    it('debe agregar stock correctamente', async () => {
      // ARRANGE
      const productId = 'product-123';
      const quantity = 50;
      const operation = 'add';

      const mockProduct = {
        id: productId,
        name: 'Laptop Dell',
        stock: 100,
        save: jest.fn()
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.updateStock(productId, quantity, operation);

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockProduct.stock).toBe(150); // 100 + 50
      expect(mockProduct.save).toHaveBeenCalledWith({ 
        transaction: mockTransaction 
      });
    });

    it('debe agregar correctamente cuando stock es 0', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        stock: 0,
        save: jest.fn()
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      await productService.updateStock('product-123', 25, 'add');

      // ASSERT
      expect(mockProduct.stock).toBe(25);
    });
  });

  describe('operación SUBTRACT', () => {
    
    it('debe restar stock correctamente', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        name: 'Mouse',
        stock: 100,
        save: jest.fn()
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.updateStock('product-123', 30, 'subtract');

      // ASSERT
      expect(result.success).toBe(true);
      expect(mockProduct.stock).toBe(70); // 100 - 30
    });

    it('debe rechazar resta si stock es insuficiente', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        stock: 10
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return result;
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.updateStock('product-123', 50, 'subtract');

      // ASSERT
      expect(result._rollback).toBe(true);
      expect(result.message).toBe('Stock insuficiente');
      expect(result.data).toEqual({
        currentStock: 10,
        requested: 50
      });
    });

    it('debe permitir restar hasta llegar a stock 0', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        stock: 25,
        save: jest.fn()
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      await productService.updateStock('product-123', 25, 'subtract');

      // ASSERT
      expect(mockProduct.stock).toBe(0);
    });

    it('debe rechazar resta exacta cuando stock es insuficiente por 1', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        stock: 10
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return result;
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.updateStock('product-123', 11, 'subtract');

      // ASSERT
      expect(result._rollback).toBe(true);
      expect(result.message).toBe('Stock insuficiente');
    });
  });

  describe('operación SET', () => {
    
    it('debe establecer stock a un valor específico', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        stock: 100,
        save: jest.fn()
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      await productService.updateStock('product-123', 250, 'set');

      // ASSERT
      expect(mockProduct.stock).toBe(250);
    });

    it('debe permitir establecer stock en 0', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        stock: 100,
        save: jest.fn()
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      await productService.updateStock('product-123', 0, 'set');

      // ASSERT
      expect(mockProduct.stock).toBe(0);
    });

    it('debe rechazar establecer stock negativo', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        stock: 100
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return result;
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.updateStock('product-123', -50, 'set');

      // ASSERT
      expect(result._rollback).toBe(true);
      expect(result.message).toBe('El stock no puede ser negativo');
    });
  });

  describe('manejo de errores', () => {
    
    it('debe rechazar operación inválida', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        stock: 100
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return result;
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.updateStock('product-123', 50, 'invalid_operation');

      // ASSERT
      expect(result._rollback).toBe(true);
      expect(result.message).toBe('Operación inválida');
    });

    it('debe rechazar si producto no existe', async () => {
      // ARRANGE
      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return result;
      });

      Product.findByPk = jest.fn().mockResolvedValue(null);

      // ACT
      const result = await productService.updateStock('product-999', 50, 'add');

      // ASSERT
      expect(result._rollback).toBe(true);
      expect(result.message).toBe('Producto no encontrado');
    });
  });

  describe('locks de transacción (CRÍTICO)', () => {
    
    it('debe usar lock UPDATE para prevenir condiciones de carrera', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        stock: 100,
        save: jest.fn()
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      await productService.updateStock('product-123', 10, 'add');

      // ASSERT
      expect(Product.findByPk).toHaveBeenCalledWith('product-123', {
        transaction: mockTransaction,
        lock: mockTransaction.LOCK.UPDATE
      });
    });

    it('debe usar nivel de aislamiento SERIALIZABLE', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        stock: 100,
        save: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      await productService.updateStock('product-123', 10, 'add');

      // ASSERT
      expect(executeWithTransaction).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'updateStock',
        expect.objectContaining({
          isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE
        })
      );
    });
  });

  describe('retorno de información', () => {
    
    it('debe retornar información completa de la operación', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        name: 'Laptop Dell',
        stock: 100,
        save: jest.fn()
      };

      const mockTransaction = {
        LOCK: { UPDATE: 'UPDATE' }
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.updateStock('product-123', 50, 'add');

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.data).toMatchObject({
        productId: 'product-123',
        name: 'Laptop Dell',
        oldStock: 100,
        newStock: 150,
        operation: 'add'
      });
    });
  });
});