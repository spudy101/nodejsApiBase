// tests/integration/api/auth.test.js
const request = require('supertest');
const app = require('../../../src/app');
const { sequelize, User, LoginAttempts } = require('../../../src/models');

describe('Auth API - Integration Tests', () => {
  let accessToken;
  let refreshToken;
  let testUser;

  // Helper para crear usuario
  const createUser = async (userData = {}) => {
    return await User.create({
      email: userData.email || 'test@example.com',
      password: userData.password || 'Password123!',
      name: userData.name || 'Test User',
      role: userData.role || 'user',
      isActive: userData.isActive !== undefined ? userData.isActive : true
    });
  };

  beforeEach(async () => {
    // Limpiar datos
    await User.destroy({ where: {}, force: true });
    await LoginAttempts.destroy({ where: {}, force: true });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          name: 'New User'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      
      expect(response.body.data.user).toMatchObject({
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user',
        isActive: true
      });
      
      expect(response.body.data.user).not.toHaveProperty('password');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      // Verificar que el usuario fue creado en DB
      const user = await User.findOne({ where: { email: 'newuser@example.com' } });
      expect(user).toBeDefined();
      expect(user.email).toBe('newuser@example.com');
    });

    it('should fail if email already exists', async () => {
      // Crear usuario primero
      await createUser({ email: 'existing@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'Password123!',
          name: 'Duplicate User'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('CONFLICT_ERROR');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak', // Too short, no uppercase, no number
          name: 'Test User'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('VALIDATION_ERROR');
      expect(response.body.errors).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should trim and lowercase email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: '  TEST@EXAMPLE.COM  ',
          password: 'Password123!',
          name: 'Test User'
        })
        .expect(201);

      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('should set default role to "user"', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          name: 'Test User'
        })
        .expect(201);

      expect(response.body.data.user.role).toBe('user');
    });

    it('should respect idempotency key', async () => {
      const idempotencyKey = 'test-idempotency-key-123';

      // Primera request
      const response1 = await request(app)
        .post('/api/auth/register')
        .set('Idempotency-Key', idempotencyKey)
        .send({
          email: 'idempotent@example.com',
          password: 'Password123!',
          name: 'Idempotent User'
        })
        .expect(201);

      // Segunda request con mismo key (debe retornar cached response)
      const response2 = await request(app)
        .post('/api/auth/register')
        .set('Idempotency-Key', idempotencyKey)
        .send({
          email: 'idempotent@example.com',
          password: 'Password123!',
          name: 'Idempotent User'
        })
        .expect(201);

      expect(response1.body).toEqual(response2.body);

      // Verificar que solo se creó UN usuario
      const count = await User.count({ where: { email: 'idempotent@example.com' } });
      expect(count).toBe(1);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Crear usuario de prueba
      testUser = await createUser({
        email: 'login@example.com',
        password: 'Password123!',
        name: 'Login Test'
      });
    });

    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      
      expect(response.body.data.user.email).toBe('login@example.com');
      expect(response.body.data.tokens).toHaveProperty('accessToken');
      expect(response.body.data.tokens).toHaveProperty('refreshToken');

      accessToken = response.body.data.tokens.accessToken;
      refreshToken = response.body.data.tokens.refreshToken;

      // Verificar que lastLogin se actualizó
      const user = await User.findByPk(testUser.id);
      expect(user.lastLogin).not.toBeNull();
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('AUTHENTICATION_ERROR');

      // Verificar que se incrementaron los intentos
      const attempts = await LoginAttempts.findOne({ 
        where: { email: 'nonexistent@example.com' } 
      });
      expect(attempts).toBeDefined();
      expect(attempts.attempts).toBe(1);
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);

      // Verificar incremento de intentos
      const attempts = await LoginAttempts.findOne({ 
        where: { email: 'login@example.com' } 
      });
      expect(attempts).toBeDefined();
      expect(attempts.attempts).toBe(1);
    });

    it('should block account after 5 failed attempts', async () => {
      // Hacer 5 intentos fallidos
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({
            email: 'login@example.com',
            password: 'WrongPassword!'
          });
      }

      // Sexto intento debe estar bloqueado
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!' // Contraseña correcta
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('bloqueado');
    });

    it('should reset attempts after successful login', async () => {
      // Hacer 2 intentos fallidos
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword!'
        });

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword!'
        });

      // Login exitoso
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        })
        .expect(200);

      // Verificar que los intentos se resetearon
      const attempts = await LoginAttempts.findOne({ 
        where: { email: 'login@example.com' } 
      });
      expect(attempts.attempts).toBe(0);
    });

    it('should fail if user is inactive', async () => {
      await testUser.update({ isActive: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/logout', () => {
    beforeEach(async () => {
      testUser = await createUser();
      
      // Login para obtener token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should invalidate token after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Intentar usar el mismo token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/refresh', () => {
    beforeEach(async () => {
      testUser = await createUser();
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
      refreshToken = loginResponse.body.data.tokens.refreshToken;
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('tokens');
      expect(response.body.data.tokens.accessToken).toBeDefined();
      expect(response.body.data.tokens.refreshToken).toBeDefined();
      
      // El nuevo token debe ser diferente
      expect(response.body.data.tokens.accessToken).not.toBe(accessToken);
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail without refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      testUser = await createUser();
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should get current user successfully', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: testUser.id,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      });
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with expired token', async () => {
      // Token expirado (simular con token inválido)
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer expired.token.here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/verify', () => {
    beforeEach(async () => {
      testUser = await createUser();
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      accessToken = loginResponse.body.data.tokens.accessToken;
    });

    it('should verify valid token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.user).toBeDefined();
    });

    it('should return invalid for bad token', async () => {
      const response = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', 'Bearer bad-token')
        .expect(200);

      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.reason).toBeDefined();
    });
  });
});
