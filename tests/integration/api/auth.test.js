// tests/integration/api/auth.test.js
const request = require('supertest');
const app = require('../../../src/app');
const { sequelize, User, LoginAttempts } = require('../../../src/models');
const { JWT } = require('../../../src/constants');

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
      expect(response.body.errorCode).toBe('CONFLICT');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'not-an-email',
          password: 'Password123!',
          name: 'Test User'
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
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
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
      expect(response.body.errors).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({})
        .expect(422);

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

    // 🔥 NUEVO TEST: Single-session mode
    it('should invalidate previous tokens when logging in again (single-session mode)', async () => {
      // Skip test if multi-session is enabled
      if (JWT.ALLOW_MULTIPLE_SESSIONS) {
        return;
      }

      // Primer login
      const login1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        })
        .expect(200);

      const refreshToken1 = login1.body.data.tokens.refreshToken;

      // Segundo login (debe invalidar el primer refresh token)
      const login2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        })
        .expect(200);

      const refreshToken2 = login2.body.data.tokens.refreshToken;

      // Los tokens deben ser diferentes
      expect(refreshToken1).not.toBe(refreshToken2);

      // El primer refresh token debe estar invalidado
      const refreshAttempt = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken1 })
        .expect(401);

      expect(refreshAttempt.body.success).toBe(false);

      // El segundo refresh token debe funcionar
      const refreshSuccess = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken2 })
        .expect(200);

      expect(refreshSuccess.body.success).toBe(true);
    });

    // 🔥 NUEVO TEST: Multi-session mode
    it('should allow multiple active sessions (multi-session mode)', async () => {
      // Skip test if single-session is enabled
      if (!JWT.ALLOW_MULTIPLE_SESSIONS) {
        return;
      }

      // Primer login (simula dispositivo 1)
      const login1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        })
        .expect(200);

      const refreshToken1 = login1.body.data.tokens.refreshToken;

      // Segundo login (simula dispositivo 2)
      const login2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!'
        })
        .expect(200);

      const refreshToken2 = login2.body.data.tokens.refreshToken;

      // Los tokens deben ser diferentes
      expect(refreshToken1).not.toBe(refreshToken2);

      // AMBOS refresh tokens deben funcionar
      const refresh1 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken1 })
        .expect(200);

      expect(refresh1.body.success).toBe(true);

      const refresh2 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken2 })
        .expect(200);

      expect(refresh2.body.success).toBe(true);
    });

    it('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!'
        })
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('CONFLICT');
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
      expect(response.body.message).toContain('Cuenta bloqueada');
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
      expect(attempts).toBeNull();
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
        .expect(422);

      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/auth/logout', () => {
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

    // 🔥 ACTUALIZADO: Ahora requiere refreshToken en body
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken }) // 🔥 Ahora es requerido
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    // 🔥 NUEVO TEST: Validar que refreshToken es requerido
    it('should fail without refresh token in body', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({}) // Sin refreshToken
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
    });

    it('should fail without access token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid access token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should invalidate access token after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Intentar usar el mismo access token
      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should invalidate refresh token after logout', async () => {
      // Logout
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Intentar refresh con el mismo refresh token
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);
    });

    // 🔥 NUEVO TEST: Multi-session logout (solo invalida una sesión)
    it('should only invalidate specific session in multi-session mode', async () => {
      // Skip test if single-session is enabled
      if (!JWT.ALLOW_MULTIPLE_SESSIONS) {
        return;
      }

      // Login en dos "dispositivos"
      const login1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        })
        .expect(200);

      const accessToken1 = login1.body.data.tokens.accessToken;
      const refreshToken1 = login1.body.data.tokens.refreshToken;

      const login2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        })
        .expect(200);

      const accessToken2 = login2.body.data.tokens.accessToken;
      const refreshToken2 = login2.body.data.tokens.refreshToken;

      // Logout solo del dispositivo 1
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken1}`)
        .send({ refreshToken: refreshToken1 })
        .expect(200);

      // Token 1 debe estar invalidado
      await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken1 })
        .expect(401);

      // Token 2 debe seguir funcionando
      const refresh2 = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: refreshToken2 })
        .expect(200);

      expect(refresh2.body.success).toBe(true);
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

    // 🔥 NUEVO TEST: Refresh token invalidado después de logout
    it('should fail to refresh after logout', async () => {
      // Logout primero
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      // Intentar refresh
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(401);

      expect(response.body.success).toBe(false);
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
        .expect(422);

      expect(response.body.errorCode).toBe('VALIDATION_ERROR');
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
});