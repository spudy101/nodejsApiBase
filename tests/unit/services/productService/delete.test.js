// test/unit/services/productService/delete.test.js
const productService = require('../../../../src/services/productService');
const { Product } = require('../../../../src/models');
const { executeWithTransaction } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('ProductService - Delete Product', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('soft delete', () => {
    
    it('debe desactivar producto (soft delete)', async () => {
      // ARRANGE
      const productId = 'product-123';
      const mockProduct = {
        id: productId,
        name: 'Producto a Eliminar',
        isActive: true,
        save: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.deleteProduct(productId);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.data.message).toContain('Producto eliminado exitosamente');
      expect(mockProduct.isActive).toBe(false);
      expect(mockProduct.save).toHaveBeenCalledWith({ transaction: expect.anything() });
    });

    it('debe ser soft delete no hard delete', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        isActive: true,
        save: jest.fn(),
        destroy: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      await productService.deleteProduct('product-123');

      // ASSERT
      expect(mockProduct.save).toHaveBeenCalled(); // Soft delete
      expect(mockProduct.destroy).not.toHaveBeenCalled(); // NO es hard delete
    });

    it('debe rechazar soft delete si producto no existe', async () => {
      // ARRANGE
      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return result;
      });

      Product.findByPk = jest.fn().mockResolvedValue(null);

      // ACT
      const result = await productService.deleteProduct('product-999');

      // ASSERT
      expect(result._rollback).toBe(true);
      expect(result.message).toBe('Producto no encontrado');
      expect(result.data).toBeNull();
    });

    it('debe retornar ID del producto eliminado', async () => {
      // ARRANGE
      const productId = 'product-123';
      const mockProduct = {
        id: productId,
        isActive: true,
        save: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.deleteProduct(productId);

      // ASSERT
      expect(result.data).toHaveProperty('productId', productId);
    });

    it('debe ejecutarse dentro de una transacción', async () => {
      // ARRANGE
      const mockTransaction = { id: 'transaction-123' };
      const mockProduct = {
        id: 'product-123',
        isActive: true,
        save: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      await productService.deleteProduct('product-123');

      // ASSERT
      expect(Product.findByPk).toHaveBeenCalledWith('product-123', { 
        transaction: mockTransaction 
      });
      expect(mockProduct.save).toHaveBeenCalledWith({ 
        transaction: mockTransaction 
      });
    });
  });

  describe('hard delete (permanente)', () => {
    
    it('debe eliminar producto permanentemente', async () => {
      // ARRANGE
      const productId = 'product-123';
      const mockProduct = {
        id: productId,
        name: 'Producto a Eliminar',
        destroy: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.permanentlyDeleteProduct(productId);

      // ASSERT
      expect(result.success).toBe(true);
      expect(result.data.message).toContain('Producto eliminado permanentemente');
      expect(mockProduct.destroy).toHaveBeenCalledWith({ transaction: expect.anything() });
    });

    it('debe usar destroy para eliminación permanente', async () => {
      // ARRANGE
      const mockProduct = {
        id: 'product-123',
        isActive: true,
        save: jest.fn(),
        destroy: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      await productService.permanentlyDeleteProduct('product-123');

      // ASSERT
      expect(mockProduct.destroy).toHaveBeenCalled(); // Hard delete
      expect(mockProduct.save).not.toHaveBeenCalled(); // NO es soft delete
    });

    it('debe rechazar hard delete si producto no existe', async () => {
      // ARRANGE
      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return result;
      });

      Product.findByPk = jest.fn().mockResolvedValue(null);

      // ACT
      const result = await productService.permanentlyDeleteProduct('product-999');

      // ASSERT
      expect(result._rollback).toBe(true);
      expect(result.message).toBe('Producto no encontrado');
      expect(result.data).toBeNull();
    });

    it('debe retornar ID del producto eliminado permanentemente', async () => {
      // ARRANGE
      const productId = 'product-456';
      const mockProduct = {
        id: productId,
        destroy: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, {});
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      const result = await productService.permanentlyDeleteProduct(productId);

      // ASSERT
      expect(result.data).toHaveProperty('productId', productId);
    });

    it('debe ejecutarse dentro de una transacción', async () => {
      // ARRANGE
      const mockTransaction = { id: 'transaction-789' };
      const mockProduct = {
        id: 'product-123',
        destroy: jest.fn()
      };

      executeWithTransaction.mockImplementation(async (data, businessLogic) => {
        const result = await businessLogic(data, mockTransaction);
        return { success: true, data: result };
      });

      Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

      // ACT
      await productService.permanentlyDeleteProduct('product-123');

      // ASSERT
      expect(Product.findByPk).toHaveBeenCalledWith('product-123', { 
        transaction: mockTransaction 
      });
      expect(mockProduct.destroy).toHaveBeenCalledWith({ 
        transaction: mockTransaction 
      });
    });
  });
});