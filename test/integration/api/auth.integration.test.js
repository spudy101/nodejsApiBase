// test/integration/api/auth.integration.test.js
const request = require('supertest');
const app = require('../../../src/app'); // Tu app de Express
const { User, LoginAttempts } = require('../../../src/models');
const { 
  createTestUser, 
  cleanDatabase 
} = require('../helpers/testHelpers');

describe('Auth API - Integration Tests', () => {

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    
    it('debe registrar un nuevo usuario exitosamente', async () => {
      // ARRANGE
      const userData = {
        email: 'newuser@example.com',
        password: 'Password123',
        name: 'New User'
      };

      // ACT
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // ASSERT
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.name).toBe(userData.name);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verificar que el usuario existe en BD
      const userInDb = await User.findOne({ where: { email: userData.email } });
      expect(userInDb).not.toBeNull();
      expect(userInDb.name).toBe(userData.name);
    });

    it('debe asignar rol "user" por defecto', async () => {
      // ARRANGE
      const userData = {
        email: 'defaultrole@example.com',
        password: 'Password123',
        name: 'Default Role User'
      };

      // ACT
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // ASSERT
      expect(response.status).toBe(201);
      expect(response.body.data.user.role).toBe('user');

      const userInDb = await User.findOne({ where: { email: userData.email } });
      expect(userInDb.role).toBe('user');
    });

    it('debe hashear la contraseña en BD', async () => {
      // ARRANGE
      const userData = {
        email: 'hashed@example.com',
        password: 'PlainPassword123',
        name: 'Hashed User'
      };

      // ACT
      await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // ASSERT
      const userInDb = await User.findOne({ where: { email: userData.email } });
      expect(userInDb.password).not.toBe(userData.password);
      expect(userInDb.password.length).toBeGreaterThan(20); // Bcrypt hash
    });

    it('debe rechazar email duplicado', async () => {
      // ARRANGE
      const email = 'duplicate@example.com';
      await createTestUser({ email });

      const userData = {
        email: email,
        password: 'Password123',
        name: 'Duplicate User'
      };

      // ACT
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe validar campos requeridos', async () => {
      // ACT
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({});

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('debe validar formato de email', async () => {
      // ACT
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123',
          name: 'Test'
        });

      // ASSERT
      expect(response.status).toBe(400);
    });

    it('debe validar longitud mínima de password', async () => {
      // ACT
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Muy corto
          name: 'Test'
        });

      // ASSERT
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    
    it('debe hacer login exitosamente con credenciales correctas', async () => {
      // ARRANGE
      const password = 'Password123';
      const user = await createTestUser({ password });

      // ACT
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: password
        });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('debe actualizar lastLogin en BD', async () => {
      // ARRANGE
      const password = 'Password123';
      const user = await createTestUser({ password });

      // ACT
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: password
        });

      // ASSERT
      const userInDb = await User.findByPk(user.id);
      expect(userInDb.lastLogin).not.toBeNull();
      expect(userInDb.lastLogin).toBeInstanceOf(Date);
    });

    it('debe rechazar login con password incorrecta', async () => {
      // ARRANGE
      const user = await createTestUser({ password: 'CorrectPassword123' });

      // ACT
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword123'
        });

      // ASSERT
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    it('debe rechazar login con email inexistente', async () => {
      // ACT
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'noexiste@example.com',
          password: 'Password123'
        });

      // ASSERT
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Credenciales inválidas');
    });

    it('debe rechazar login si usuario está inactivo', async () => {
      // ARRANGE
      const password = 'Password123';
      const user = await createTestUser({ password, isActive: false });

      // ACT
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: password
        });

      // ASSERT
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Usuario inactivo');
    });

    it('debe bloquear cuenta después de 5 intentos fallidos', async () => {
      // ARRANGE
      const password = 'CorrectPassword123';
      const user = await createTestUser({ password });

      // ACT - 5 intentos fallidos
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: user.email,
            password: 'WrongPassword'
          });
      }

      // Intento 6 con password correcta
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: password
        });

      // ASSERT
      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Cuenta bloqueada');

      // Verificar en BD
      const loginAttempt = await LoginAttempts.findOne({ 
        where: { email: user.email } 
      });
      expect(loginAttempt.attempts).toBe(5);
      expect(loginAttempt.blockedUntil).not.toBeNull();
    });

    it('debe incrementar contador de intentos fallidos', async () => {
      // ARRANGE
      const password = 'CorrectPassword123';
      const user = await createTestUser({ password });

      // ACT - 3 intentos fallidos
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: user.email,
            password: 'WrongPassword'
          });
      }

      // ASSERT
      const loginAttempt = await LoginAttempts.findOne({ 
        where: { email: user.email } 
      });
      expect(loginAttempt.attempts).toBe(3);
    });

    it('debe resetear intentos después de login exitoso', async () => {
      // ARRANGE
      const password = 'Password123';
      const user = await createTestUser({ password });

      // Crear 3 intentos fallidos previos
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/api/v1/auth/login')
          .send({
            email: user.email,
            password: 'WrongPassword'
          });
      }

      // ACT - Login exitoso
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: password
        });

      // ASSERT
      const loginAttempt = await LoginAttempts.findOne({ 
        where: { email: user.email } 
      });
      expect(loginAttempt.attempts).toBe(0);
      expect(loginAttempt.blockedUntil).toBeNull();
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    
    it('debe obtener perfil de usuario autenticado', async () => {
      // ARRANGE
      const password = 'Password123';
      const user = await createTestUser({ password });
      
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password });
      
      const token = loginResponse.body.data.token;

      // ACT
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(user.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('debe rechazar sin token de autenticación', async () => {
      // ACT
      const response = await request(app)
        .get('/api/v1/auth/profile');

      // ASSERT
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('debe rechazar con token inválido', async () => {
      // ACT
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      // ASSERT
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/auth/profile', () => {
    
    it('debe actualizar perfil de usuario', async () => {
      // ARRANGE
      const password = 'Password123';
      const user = await createTestUser({ password });
      
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password });
      
      const token = loginResponse.body.data.token;

      const updateData = {
        name: 'Nombre Actualizado',
        email: 'nuevo@example.com'
      };

      // ACT
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.email).toBe(updateData.email);

      // Verificar en BD
      const userInDb = await User.findByPk(user.id);
      expect(userInDb.name).toBe(updateData.name);
      expect(userInDb.email).toBe(updateData.email);
    });

    it('debe rechazar actualización sin autenticación', async () => {
      // ACT
      const response = await request(app)
        .put('/api/v1/auth/profile')
        .send({ name: 'Test' });

      // ASSERT
      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/v1/auth/change-password', () => {
    
    it('debe cambiar contraseña exitosamente', async () => {
      // ARRANGE
      const currentPassword = 'OldPassword123';
      const newPassword = 'NewPassword456';
      const user = await createTestUser({ password: currentPassword });
      
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: currentPassword });
      
      const token = loginResponse.body.data.token;

      // ACT
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword,
          newPassword,
          confirmPassword: newPassword
        });

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que puede hacer login con nueva contraseña
      const loginWithNewPassword = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: newPassword });
      
      expect(loginWithNewPassword.status).toBe(200);
    });

    it('debe rechazar si contraseña actual es incorrecta', async () => {
      // ARRANGE
      const currentPassword = 'CorrectPassword123';
      const user = await createTestUser({ password: currentPassword });
      
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: currentPassword });
      
      const token = loginResponse.body.data.token;

      // ACT
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword456',
          confirmPassword: 'NewPassword456'
        });

      // ASSERT
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('contraseña actual es incorrecta');
    });

    it('debe validar que confirmPassword coincida', async () => {
      // ARRANGE
      const currentPassword = 'Password123';
      const user = await createTestUser({ password: currentPassword });
      
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password: currentPassword });
      
      const token = loginResponse.body.data.token;

      // ACT
      const response = await request(app)
        .put('/api/v1/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword,
          newPassword: 'NewPassword456',
          confirmPassword: 'DifferentPassword789'
        });

      // ASSERT
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/v1/auth/account', () => {
    
    it('debe desactivar cuenta de usuario', async () => {
      // ARRANGE
      const password = 'Password123';
      const user = await createTestUser({ password });
      
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password });
      
      const token = loginResponse.body.data.token;

      // ACT
      const response = await request(app)
        .delete('/api/v1/auth/account')
        .set('Authorization', `Bearer ${token}`);

      // ASSERT
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verificar que el usuario está inactivo en BD
      const userInDb = await User.findByPk(user.id);
      expect(userInDb.isActive).toBe(false);

      // Verificar que no puede hacer login
      const loginAttempt = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: user.email, password });
      
      expect(loginAttempt.status).toBe(401);
    });
  });
});