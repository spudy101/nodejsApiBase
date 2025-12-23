// test/integration/api/products.integration.test.js
const request = require('supertest');
const app = require('../../../src/app');
const { Product } = require('../../../src/models');
const { 
  createTestProduct,
  createAdminAndLogin,
  createUserAndLogin,
  cleanDatabase 
} = require('../helpers/testHelpers');

describe('Products API - Integration Tests', () => {

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/v1/products', () => {
    
    it('debe crear producto con autenticación admin', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const productData = {
        name: 'Laptop Dell XPS',
        description: 'Laptop de alta gama',
        price: 1500000,
        stock: 10,
        category: 'electronics'
      };

      // ACT
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .send(productData);

      // ASSERT
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(productData.name);
      expect(response.body.data.price).toBe(productData.price);
      expect(response.body.data.stock).toBe(productData.stock);
      expect(response.body.data.createdBy).toBe(admin.id);

      // Verificar en BD
      const productInDb = await Product.findOne({ 
        where: { name: productData.name } 
      });
      expect(productInDb).not.toBeNull();
      expect(productInDb.description).toBe(productData.description);
    });

    it('debe rechazar creación sin autenticación', async () => {
      // ACT
      const response = await request(app)
        .post('/api/v1/products')
        .send({ name: 'Test', price: 100 });

      // ASSERT
      expect(response.status).toBe(401);
    });

    it('debe rechazar creación con rol user', async () => {
      // ARRANGE
      const { user, token } = await createUserAndLogin(app);

      // ACT
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test Product',
          description: 'Test',
          price: 100000,
          stock: 5,
          category: 'test'
        });

      // ASSERT
      expect(response.status).toBe(403);
    });

    it('debe validar campos requeridos', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);

      // ACT
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      // ASSERT
      expect(response.status).toBe(400);
    });

    it('debe validar precio positivo', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);

      // ACT
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test',
          description: 'Test',
          price: -100,
          stock: 5,
          category: 'test'
        });

      // ASSERT
      expect(response.status).toBe(400);
    });

    it('debe validar stock no negativo', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);

      // ACT
      const response = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Test',
          description: 'Test',
          price: 100000,
          stock: -5,
          category: 'test'
        });

      // ASSERT
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/products', () => {
    
    it('debe listar productos públicamente (sin auth)', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      await createTestProduct(admin.id);
      await createTestProduct(admin.id);

      // ACT
      const response = await request(app)
        .get('/api/v1/products');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toBeDefined();
    });

    it('debe paginar resultados correctamente', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      
      // Crear 15 productos
      for (let i = 0; i < 15; i++) {
        await createTestProduct(admin.id);
      }

      // ACT
      const response = await request(app)
        .get('/api/v1/products?page=1&limit=10');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.totalPages).toBe(2);
      expect(response.body.pagination.total).toBe(15);
    });

    it('debe filtrar productos por categoría', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      await createTestProduct(admin.id, { category: 'electronics' });
      await createTestProduct(admin.id, { category: 'electronics' });
      await createTestProduct(admin.id, { category: 'accessories' });

      // ACT
      const response = await request(app)
        .get('/api/v1/products?category=electronics');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(p => p.category === 'electronics')).toBe(true);
    });

    it('debe filtrar productos por estado activo', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      await createTestProduct(admin.id, { isActive: true });
      await createTestProduct(admin.id, { isActive: true });
      await createTestProduct(admin.id, { isActive: false });

      // ACT
      const response = await request(app)
        .get('/api/v1/products?isActive=true');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.every(p => p.isActive === true)).toBe(true);
    });

    it('debe filtrar productos por rango de precios', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      await createTestProduct(admin.id, { price: 50000 });
      await createTestProduct(admin.id, { price: 100000 });
      await createTestProduct(admin.id, { price: 500000 });
      await createTestProduct(admin.id, { price: 1000000 });

      // ACT
      const response = await request(app)
        .get('/api/v1/products?minPrice=100000&maxPrice=600000');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach(product => {
        expect(product.price).toBeGreaterThanOrEqual(100000);
        expect(product.price).toBeLessThanOrEqual(600000);
      });
    });

    it('debe buscar productos por nombre o descripción', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      await createTestProduct(admin.id, { name: 'Laptop HP', description: 'Laptop gamer' });
      await createTestProduct(admin.id, { name: 'Mouse Logitech', description: 'Mouse inalámbrico' });
      await createTestProduct(admin.id, { name: 'Teclado mecánico', description: 'Teclado RGB' });

      // ACT
      const response = await request(app)
        .get('/api/v1/products?search=laptop');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.data.some(p => 
          p.name.toLowerCase().includes('laptop') || 
          p.description.toLowerCase().includes('laptop')
        )
      ).toBe(true);
    });

    it('debe ordenar productos por precio ascendente', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      await createTestProduct(admin.id, { price: 500000 });
      await createTestProduct(admin.id, { price: 100000 });
      await createTestProduct(admin.id, { price: 300000 });

      // ACT
      const response = await request(app)
        .get('/api/v1/products?sortBy=price&sortOrder=ASC');

      // ASSERT
      expect(response.status).toBe(200);
      const prices = response.body.data.map(p => p.price);
      expect(prices).toEqual([...prices].sort((a, b) => a - b));
    });

    it('debe incluir información del creador', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      await createTestProduct(admin.id);

      // ACT
      const response = await request(app)
        .get('/api/v1/products');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data[0]).toHaveProperty('creator');
      expect(response.body.data[0].creator).toHaveProperty('id');
      expect(response.body.data[0].creator).toHaveProperty('name');
      expect(response.body.data[0].creator).toHaveProperty('email');
    });
  });

  describe('GET /api/v1/products/:id', () => {
    
    it('debe obtener producto por ID', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id, { 
        name: 'Producto Test' 
      });

      // ACT
      const response = await request(app)
        .get(`/api/v1/products/${product.id}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(product.id);
      expect(response.body.data.name).toBe('Producto Test');
    });

    it('debe retornar 404 si producto no existe', async () => {
      // ACT
      const response = await request(app)
        .get('/api/v1/products/99999999-9999-9999-9999-999999999999');

      // ASSERT
      expect(response.status).toBe(404);
    });

    it('debe incluir información del creador', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id);

      // ACT
      const response = await request(app)
        .get(`/api/v1/products/${product.id}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('creator');
      expect(response.body.data.creator.id).toBe(admin.id);
    });
  });

  describe('PUT /api/v1/products/:id', () => {
    
    it('debe actualizar producto con autenticación admin', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id);

      const updateData = {
        name: 'Nombre Actualizado',
        description: 'Descripción actualizada',
        price: 200000,
        stock: 25,
        category: 'updated-category'
      };

      // ACT
      const response = await request(app)
        .put(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.price).toBe(updateData.price);

      // Verificar en BD
      const productInDb = await Product.findByPk(product.id);
      expect(productInDb.name).toBe(updateData.name);
      expect(productInDb.description).toBe(updateData.description);
    });

    it('debe rechazar actualización sin autenticación', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id);

      // ACT
      const response = await request(app)
        .put(`/api/v1/products/${product.id}`)
        .send({ name: 'Test' });

      // ASSERT
      expect(response.status).toBe(401);
    });

    it('debe rechazar actualización con rol user', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      const { user, token } = await createUserAndLogin(app);
      const product = await createTestProduct(admin.id);

      // ACT
      const response = await request(app)
        .put(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test' });

      // ASSERT
      expect(response.status).toBe(403);
    });
  });

  describe('PATCH /api/v1/products/:id/stock', () => {
    
    it('debe agregar stock correctamente (operación ADD)', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id, { stock: 100 });

      // ACT
      const response = await request(app)
        .patch(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 50,
          operation: 'add'
        });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.newStock).toBe(150);

      // Verificar en BD
      const productInDb = await Product.findByPk(product.id);
      expect(productInDb.stock).toBe(150);
    });

    it('debe restar stock correctamente (operación SUBTRACT)', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id, { stock: 100 });

      // ACT
      const response = await request(app)
        .patch(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 30,
          operation: 'subtract'
        });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.newStock).toBe(70);

      const productInDb = await Product.findByPk(product.id);
      expect(productInDb.stock).toBe(70);
    });

    it('debe rechazar resta si stock es insuficiente', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id, { stock: 10 });

      // ACT
      const response = await request(app)
        .patch(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 50,
          operation: 'subtract'
        });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Stock insuficiente');
    });

    it('debe establecer stock (operación SET)', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id, { stock: 100 });

      // ACT
      const response = await request(app)
        .patch(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: 250,
          operation: 'set'
        });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.newStock).toBe(250);

      const productInDb = await Product.findByPk(product.id);
      expect(productInDb.stock).toBe(250);
    });

    it('debe rechazar stock negativo en operación SET', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id);

      // ACT
      const response = await request(app)
        .patch(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          quantity: -50,
          operation: 'set'
        });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('no puede ser negativo');
    });

    it('debe prevenir condiciones de carrera en actualización de stock', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id, { stock: 100 });

      // ACT - Dos requests simultáneas
      const [response1, response2] = await Promise.all([
        request(app)
          .patch(`/api/v1/products/${product.id}/stock`)
          .set('Authorization', `Bearer ${token}`)
          .send({ quantity: 30, operation: 'subtract' }),
        request(app)
          .patch(`/api/v1/products/${product.id}/stock`)
          .set('Authorization', `Bearer ${token}`)
          .send({ quantity: 40, operation: 'subtract' })
      ]);

      // ASSERT
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);

      // Verificar stock final en BD
      const productInDb = await Product.findByPk(product.id);
      expect(productInDb.stock).toBe(30); // 100 - 30 - 40 = 30
    });

    it('debe rechazar sin autenticación', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id);

      // ACT
      const response = await request(app)
        .patch(`/api/v1/products/${product.id}/stock`)
        .send({ quantity: 10, operation: 'add' });

      // ASSERT
      expect(response.status).toBe(401);
    });

    it('debe rechazar con rol user', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      const { user, token } = await createUserAndLogin(app);
      const product = await createTestProduct(admin.id);

      // ACT
      const response = await request(app)
        .patch(`/api/v1/products/${product.id}/stock`)
        .set('Authorization', `Bearer ${token}`)
        .send({ quantity: 10, operation: 'add' });

      // ASSERT
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/products/:id', () => {
    
    it('debe desactivar producto (soft delete)', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id, { isActive: true });

      // ACT
      const response = await request(app)
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que sigue en BD pero inactivo
      const productInDb = await Product.findByPk(product.id);
      expect(productInDb).not.toBeNull();
      expect(productInDb.isActive).toBe(false);
    });

    it('debe rechazar sin autenticación', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id);

      // ACT
      const response = await request(app)
        .delete(`/api/v1/products/${product.id}`);

      // ASSERT
      expect(response.status).toBe(401);
    });

    it('debe rechazar con rol user', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      const { user, token } = await createUserAndLogin(app);
      const product = await createTestProduct(admin.id);

      // ACT
      const response = await request(app)
        .delete(`/api/v1/products/${product.id}`)
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/v1/products/:id/permanent', () => {
    
    it('debe eliminar producto permanentemente', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const product = await createTestProduct(admin.id);
      const productId = product.id;

      // ACT
      const response = await request(app)
        .delete(`/api/v1/products/${productId}/permanent`)
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que ya no existe en BD
      const productInDb = await Product.findByPk(productId);
      expect(productInDb).toBeNull();
    });
  });

  describe('GET /api/v1/products/category/:category', () => {
    
    it('debe obtener productos por categoría', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      await createTestProduct(admin.id, { category: 'electronics', isActive: true });
      await createTestProduct(admin.id, { category: 'electronics', isActive: true });
      await createTestProduct(admin.id, { category: 'accessories', isActive: true });

      // ACT
      const response = await request(app)
        .get('/api/v1/products/category/electronics');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data.every(p => p.category === 'electronics')).toBe(true);
    });

    it('debe retornar solo productos activos', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      await createTestProduct(admin.id, { category: 'electronics', isActive: true });
      await createTestProduct(admin.id, { category: 'electronics', isActive: false });

      // ACT
      const response = await request(app)
        .get('/api/v1/products/category/electronics');

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isActive).toBe(true);
    });

    it('debe ordenar por nombre ascendente', async () => {
      // ARRANGE
      const { admin } = await createAdminAndLogin(app);
      await createTestProduct(admin.id, { category: 'test', name: 'Zebra' });
      await createTestProduct(admin.id, { category: 'test', name: 'Alpha' });
      await createTestProduct(admin.id, { category: 'test', name: 'Bravo' });

      // ACT
      const response = await request(app)
        .get('/api/v1/products/category/test');

      // ASSERT
      expect(response.status).toBe(200);
      const names = response.body.data.map(p => p.name);
      expect(names).toEqual(['Alpha', 'Bravo', 'Zebra']);
    });
  });

  describe('GET /api/v1/products/stats', () => {
    
    it('debe obtener estadísticas de productos', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      await createTestProduct(admin.id, { isActive: true, stock: 10, price: 100000 });
      await createTestProduct(admin.id, { isActive: true, stock: 0, price: 200000 });
      await createTestProduct(admin.id, { isActive: false, stock: 5, price: 300000 });
      await createTestProduct(admin.id, { isActive: true, stock: 8, price: 400000 });

      // ACT
      const response = await request(app)
        .get('/api/v1/products/stats')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('active');
      expect(response.body.data).toHaveProperty('inactive');
      expect(response.body.data).toHaveProperty('outOfStock');
      expect(response.body.data).toHaveProperty('lowStock');
      expect(response.body.data).toHaveProperty('averagePrice');
      expect(response.body.data).toHaveProperty('totalStock');

      expect(parseInt(response.body.data.total)).toBe(4);
      expect(parseInt(response.body.data.active)).toBe(3);
      expect(parseInt(response.body.data.inactive)).toBe(1);
      expect(parseInt(response.body.data.outOfStock)).toBe(1);
      expect(parseInt(response.body.data.lowStock)).toBeGreaterThanOrEqual(1);
    });

    it('debe rechazar sin autenticación', async () => {
      // ACT
      const response = await request(app)
        .get('/api/v1/products/stats');

      // ASSERT
      expect(response.status).toBe(401);
    });

    it('debe rechazar con rol user', async () => {
      // ARRANGE
      const { user, token } = await createUserAndLogin(app);

      // ACT
      const response = await request(app)
        .get('/api/v1/products/stats')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(403);
    });
  });
});