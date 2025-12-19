// test/unit/services/productService/update.test.js
const productService = require('../../../../src/services/productService');
const { Product } = require('../../../../src/models');
const { executeWithTransaction } = require('../../../../src/utils/transactionWrapper');

jest.mock('../../../../src/models');
jest.mock('../../../../src/utils/transactionWrapper');
jest.mock('../../../../src/utils/logger');

describe('ProductService - Update Product', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe actualizar producto exitosamente', async () => {
    // ARRANGE
    const productId = 'product-123';
    const userId = 'user-456';
    const updateData = {
      name: 'Laptop Dell XPS Actualizada',
      description: 'Nueva descripción',
      price: 1800000,
      stock: 15,
      category: 'electronics',
      isActive: true
    };

    const mockProduct = {
      id: productId,
      name: 'Laptop Dell',
      description: 'Descripción antigua',
      price: 1500000,
      stock: 10,
      category: 'electronics',
      isActive: true,
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        id: productId,
        ...updateData
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    const result = await productService.updateProduct(productId, updateData, userId);

    // ASSERT
    expect(result.success).toBe(true);
    expect(mockProduct.name).toBe(updateData.name);
    expect(mockProduct.description).toBe(updateData.description);
    expect(mockProduct.price).toBe(updateData.price);
    expect(mockProduct.stock).toBe(updateData.stock);
    expect(mockProduct.category).toBe(updateData.category);
    expect(mockProduct.save).toHaveBeenCalledWith({ transaction: expect.anything() });
  });

  it('debe actualizar solo los campos proporcionados', async () => {
    // ARRANGE
    const updateData = {
      name: 'Nuevo Nombre',
      price: 200000
      // No se proporcionan otros campos
    };

    const mockProduct = {
      id: 'product-123',
      name: 'Nombre Viejo',
      description: 'Descripción Original',
      price: 100000,
      stock: 50,
      category: 'accessories',
      isActive: true,
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.updateProduct('product-123', updateData, 'user-123');

    // ASSERT
    expect(mockProduct.name).toBe('Nuevo Nombre');
    expect(mockProduct.price).toBe(200000);
    // Campos no modificados deben mantener su valor
    expect(mockProduct.description).toBe('Descripción Original');
    expect(mockProduct.stock).toBe(50);
    expect(mockProduct.category).toBe('accessories');
  });

  it('debe actualizar nombre solamente', async () => {
    // ARRANGE
    const mockProduct = {
      id: 'product-123',
      name: 'Nombre Original',
      price: 100000,
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.updateProduct('product-123', { name: 'Nuevo Nombre' }, 'user-123');

    // ASSERT
    expect(mockProduct.name).toBe('Nuevo Nombre');
    expect(mockProduct.price).toBe(100000); // No cambió
  });

  it('debe actualizar precio solamente', async () => {
    // ARRANGE
    const mockProduct = {
      id: 'product-123',
      name: 'Producto Test',
      price: 100000,
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.updateProduct('product-123', { price: 150000 }, 'user-123');

    // ASSERT
    expect(mockProduct.price).toBe(150000);
    expect(mockProduct.name).toBe('Producto Test'); // No cambió
  });

  it('debe actualizar estado isActive', async () => {
    // ARRANGE
    const mockProduct = {
      id: 'product-123',
      name: 'Producto',
      isActive: true,
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.updateProduct('product-123', { isActive: false }, 'user-123');

    // ASSERT
    expect(mockProduct.isActive).toBe(false);
  });

  it('debe actualizar categoría', async () => {
    // ARRANGE
    const mockProduct = {
      id: 'product-123',
      category: 'electronics',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.updateProduct('product-123', { category: 'accessories' }, 'user-123');

    // ASSERT
    expect(mockProduct.category).toBe('accessories');
  });

  it('debe actualizar stock', async () => {
    // ARRANGE
    const mockProduct = {
      id: 'product-123',
      stock: 10,
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.updateProduct('product-123', { stock: 50 }, 'user-123');

    // ASSERT
    expect(mockProduct.stock).toBe(50);
  });

  it('debe actualizar descripción', async () => {
    // ARRANGE
    const mockProduct = {
      id: 'product-123',
      description: 'Descripción original',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.updateProduct('product-123', { description: 'Nueva descripción' }, 'user-123');

    // ASSERT
    expect(mockProduct.description).toBe('Nueva descripción');
  });

  it('debe rechazar actualización si producto no existe', async () => {
    // ARRANGE
    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return result;
    });

    Product.findByPk = jest.fn().mockResolvedValue(null);

    // ACT
    const result = await productService.updateProduct('product-999', { name: 'Test' }, 'user-123');

    // ASSERT
    expect(result._rollback).toBe(true);
    expect(result.message).toBe('Producto no encontrado');
    expect(result.data).toBeNull();
  });

  it('debe guardar producto dentro de la transacción', async () => {
    // ARRANGE
    const mockTransaction = { id: 'transaction-123' };
    const mockProduct = {
      id: 'product-123',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, mockTransaction);
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.updateProduct('product-123', { name: 'Test' }, 'user-123');

    // ASSERT
    expect(mockProduct.save).toHaveBeenCalledWith({ 
      transaction: mockTransaction 
    });
  });

  it('debe buscar producto dentro de la transacción', async () => {
    // ARRANGE
    const mockTransaction = { id: 'transaction-123' };
    const mockProduct = {
      id: 'product-123',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, mockTransaction);
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.updateProduct('product-123', { name: 'Test' }, 'user-123');

    // ASSERT
    expect(Product.findByPk).toHaveBeenCalledWith('product-123', { 
      transaction: mockTransaction 
    });
  });

  it('debe retornar producto actualizado en formato JSON', async () => {
    // ARRANGE
    const updateData = {
      name: 'Producto Actualizado',
      price: 300000
    };

    const mockProduct = {
      id: 'product-123',
      name: 'Original',
      price: 100000,
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({
        id: 'product-123',
        name: 'Producto Actualizado',
        price: 300000
      })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    const result = await productService.updateProduct('product-123', updateData, 'user-123');

    // ASSERT
    expect(mockProduct.toJSON).toHaveBeenCalled();
    expect(result.data).toMatchObject({
      id: 'product-123',
      name: 'Producto Actualizado',
      price: 300000
    });
  });

  it('debe solo actualizar campos permitidos', async () => {
    // ARRANGE
    const updateData = {
      name: 'Nuevo Nombre',
      price: 200000,
      id: 'otro-id', // Campo no permitido
      createdBy: 'otro-usuario', // Campo no permitido
      createdAt: new Date() // Campo no permitido
    };

    const mockProduct = {
      id: 'product-123',
      name: 'Original',
      price: 100000,
      description: 'Desc',
      stock: 10,
      category: 'cat',
      isActive: true,
      createdBy: 'user-original',
      save: jest.fn(),
      toJSON: jest.fn().mockReturnValue({ id: 'product-123' })
    };

    executeWithTransaction.mockImplementation(async (data, businessLogic) => {
      const result = await businessLogic(data, {});
      return { success: true, data: result };
    });

    Product.findByPk = jest.fn().mockResolvedValue(mockProduct);

    // ACT
    await productService.updateProduct('product-123', updateData, 'user-123');

    // ASSERT
    // Solo deben actualizarse los campos permitidos
    expect(mockProduct.name).toBe('Nuevo Nombre');
    expect(mockProduct.price).toBe(200000);
    // Campos no permitidos no deben cambiar
    expect(mockProduct.id).toBe('product-123');
    expect(mockProduct.createdBy).toBe('user-original');
  });
});