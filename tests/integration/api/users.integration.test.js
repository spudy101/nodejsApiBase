// test/integration/api/users.integration.test.js
const request = require('supertest');
const app = require('../../../src/app');
const { User } = require('../../../src/models');
const { 
  createTestUser,
  createAdminAndLogin,
  createUserAndLogin,
  cleanDatabase 
} = require('../helpers/testHelpers');

describe('Users API - Integration Tests', () => {

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('GET /api/v1/users', () => {
    
    it('debe listar usuarios con autenticación admin', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      await createTestUser();
      await createTestUser();

      // ACT
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3); // 2 usuarios + 1 admin
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.total).toBe(3);
    });

    it('debe rechazar acceso sin autenticación', async () => {
      // ACT
      const response = await request(app)
        .get('/api/v1/users');

      // ASSERT
      expect(response.status).toBe(401);
    });

    it('debe rechazar acceso con rol user', async () => {
      // ARRANGE
      const { user, token } = await createUserAndLogin(app);

      // ACT
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(403);
      expect(response.body.message).toContain('No tienes permisos');
    });

    it('debe paginar resultados correctamente', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      
      // Crear 15 usuarios
      for (let i = 0; i < 15; i++) {
        await createTestUser();
      }

      // ACT - Primera página
      const response1 = await request(app)
        .get('/api/v1/users?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

      // Segunda página
      const response2 = await request(app)
        .get('/api/v1/users?page=2&limit=10')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response1.status).toBe(200);
      expect(response1.body.data).toHaveLength(10);
      expect(response1.body.pagination.page).toBe(1);
      expect(response1.body.pagination.totalPages).toBe(2);

      expect(response2.status).toBe(200);
      expect(response2.body.data).toHaveLength(6); // 15 usuarios + 1 admin = 16 total, página 2 tiene 6
      expect(response2.body.pagination.page).toBe(2);
    });

    it('debe filtrar usuarios por rol', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      await createTestUser({ role: 'user' });
      await createTestUser({ role: 'user' });
      await createAdminAndLogin(app);

      // ACT
      const response = await request(app)
        .get('/api/v1/users?role=admin')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(2); // 2 admins
      expect(response.body.data.every(u => u.role === 'admin')).toBe(true);
    });

    it('debe filtrar usuarios por estado activo', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      await createTestUser({ isActive: true });
      await createTestUser({ isActive: true });
      await createTestUser({ isActive: false });

      // ACT
      const response = await request(app)
        .get('/api/v1/users?isActive=true')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.every(u => u.isActive === true)).toBe(true);
    });

    it('debe buscar usuarios por nombre o email', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      await createTestUser({ name: 'Juan Pérez', email: 'juan@example.com' });
      await createTestUser({ name: 'María García', email: 'maria@example.com' });
      await createTestUser({ name: 'Pedro López', email: 'pedro@example.com' });

      // ACT
      const response = await request(app)
        .get('/api/v1/users?search=juan')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.data.some(u => 
          u.name.toLowerCase().includes('juan') || 
          u.email.toLowerCase().includes('juan')
        )
      ).toBe(true);
    });

    it('debe excluir password de los resultados', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      await createTestUser();

      // ACT
      const response = await request(app)
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      response.body.data.forEach(user => {
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('GET /api/v1/users/:id', () => {
    
    it('debe obtener usuario por ID', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const user = await createTestUser({ name: 'Test User' });

      // ACT
      const response = await request(app)
        .get(`/api/v1/users/${user.id}`)
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(user.id);
      expect(response.body.data.name).toBe('Test User');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('debe retornar 404 si usuario no existe', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);

      // ACT
      const response = await request(app)
        .get('/api/v1/users/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('debe rechazar acceso sin autenticación', async () => {
      // ARRANGE
      const user = await createTestUser();

      // ACT
      const response = await request(app)
        .get(`/api/v1/users/${user.id}`);

      // ASSERT
      expect(response.status).toBe(401);
    });

    it('debe rechazar acceso con rol user', async () => {
      // ARRANGE
      const { user, token } = await createUserAndLogin(app);
      const otherUser = await createTestUser();

      // ACT
      const response = await request(app)
        .get(`/api/v1/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/v1/users/:id/role', () => {
    
    it('debe actualizar rol de usuario de user a admin', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const user = await createTestUser({ role: 'user' });

      // ACT
      const response = await request(app)
        .put(`/api/v1/users/${user.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'admin' });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('admin');

      // Verificar en BD
      const userInDb = await User.findByPk(user.id);
      expect(userInDb.role).toBe('admin');
    });

    it('debe actualizar rol de admin a user', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const anotherAdmin = await createTestUser({ role: 'admin' });

      // ACT
      const response = await request(app)
        .put(`/api/v1/users/${anotherAdmin.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'user' });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.data.role).toBe('user');

      const userInDb = await User.findByPk(anotherAdmin.id);
      expect(userInDb.role).toBe('user');
    });

    it('debe rechazar rol inválido', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const user = await createTestUser();

      // ACT
      const response = await request(app)
        .put(`/api/v1/users/${user.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'superadmin' });

      // ASSERT
      expect(response.status).toBe(400);
    });

    it('debe rechazar si usuario no existe', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);

      // ACT
      const response = await request(app)
        .put('/api/v1/users/99999999-9999-9999-9999-999999999999/role')
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'admin' });

      // ASSERT
      expect(response.status).toBe(400);
    });

    it('debe rechazar sin autenticación', async () => {
      // ARRANGE
      const user = await createTestUser();

      // ACT
      const response = await request(app)
        .put(`/api/v1/users/${user.id}/role`)
        .send({ role: 'admin' });

      // ASSERT
      expect(response.status).toBe(401);
    });

    it('debe rechazar con rol user', async () => {
      // ARRANGE
      const { user, token } = await createUserAndLogin(app);
      const otherUser = await createTestUser();

      // ACT
      const response = await request(app)
        .put(`/api/v1/users/${otherUser.id}/role`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'admin' });

      // ASSERT
      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/v1/users/:id/activate', () => {
    
    it('debe activar usuario inactivo', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const user = await createTestUser({ isActive: false });

      // ACT
      const response = await request(app)
        .put(`/api/v1/users/${user.id}/activate`)
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const userInDb = await User.findByPk(user.id);
      expect(userInDb.isActive).toBe(true);
    });

    it('debe rechazar si usuario no existe', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);

      // ACT
      const response = await request(app)
        .put('/api/v1/users/99999999-9999-9999-9999-999999999999/activate')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/v1/users/:id/deactivate', () => {
    
    it('debe desactivar usuario activo', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const user = await createTestUser({ isActive: true });

      // ACT
      const response = await request(app)
        .put(`/api/v1/users/${user.id}/deactivate`)
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const userInDb = await User.findByPk(user.id);
      expect(userInDb.isActive).toBe(false);
    });
  });

  describe('DELETE /api/v1/users/:id', () => {
    
    it('debe eliminar usuario permanentemente', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      const user = await createTestUser();
      const userId = user.id;

      // ACT
      const response = await request(app)
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que ya no existe en BD
      const userInDb = await User.findByPk(userId);
      expect(userInDb).toBeNull();
    });

    it('debe rechazar si usuario no existe', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);

      // ACT
      const response = await request(app)
        .delete('/api/v1/users/99999999-9999-9999-9999-999999999999')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(400);
    });

    it('debe rechazar sin autenticación', async () => {
      // ARRANGE
      const user = await createTestUser();

      // ACT
      const response = await request(app)
        .delete(`/api/v1/users/${user.id}`);

      // ASSERT
      expect(response.status).toBe(401);
    });

    it('debe rechazar con rol user', async () => {
      // ARRANGE
      const { user, token } = await createUserAndLogin(app);
      const otherUser = await createTestUser();

      // ACT
      const response = await request(app)
        .delete(`/api/v1/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/v1/users/stats', () => {
    
    it('debe obtener estadísticas de usuarios', async () => {
      // ARRANGE
      const { admin, token } = await createAdminAndLogin(app);
      await createTestUser({ role: 'user', isActive: true });
      await createTestUser({ role: 'user', isActive: true });
      await createTestUser({ role: 'user', isActive: false });
      await createTestUser({ role: 'admin', isActive: true });

      // ACT
      const response = await request(app)
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('active');
      expect(response.body.data).toHaveProperty('inactive');
      expect(response.body.data).toHaveProperty('admins');
      expect(response.body.data).toHaveProperty('users');
      
      expect(parseInt(response.body.data.total)).toBe(5);
      expect(parseInt(response.body.data.active)).toBe(4);
      expect(parseInt(response.body.data.inactive)).toBe(1);
      expect(parseInt(response.body.data.admins)).toBe(2);
      expect(parseInt(response.body.data.users)).toBe(3);
    });

    it('debe rechazar sin autenticación', async () => {
      // ACT
      const response = await request(app)
        .get('/api/v1/users/stats');

      // ASSERT
      expect(response.status).toBe(401);
    });

    it('debe rechazar con rol user', async () => {
      // ARRANGE
      const { user, token } = await createUserAndLogin(app);

      // ACT
      const response = await request(app)
        .get('/api/v1/users/stats')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(403);
    });
  });
});