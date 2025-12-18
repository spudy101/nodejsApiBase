// tests/integration/api/perfil.test.js
const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../../src/app');
const { encriptarMensaje } = require('../../../src/utils/cryptoUtils');

describe('API /perfil_usuario', () => {
  let jwtToken;
  let userToken;

  beforeAll(() => {
    // Crear token JWT válido para tests
    userToken = 'test-user-token-123';
    jwtToken = jwt.sign({ token: userToken }, process.env.SECRET_JWT_KEY);
  });

  describe('GET /perfil_usuario/datos_usuario', () => {
    it('debería retornar 401 sin token', async () => {
      const timestamp = encriptarMensaje(Date.now().toString());
      
      const response = await request(app)
        .get('/perfil_usuario/datos_usuario')
        .set('timestamp', timestamp);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'AUTH_REQUIRED');
    });

    it('debería retornar 401 sin timestamp', async () => {
      const response = await request(app)
        .get('/perfil_usuario/datos_usuario')
        .set('Cookie', [`jwtToken=${jwtToken}`]);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'AUTH_REQUIRED');
    });

    it('debería retornar 401 con timestamp expirado', async () => {
      const oldTimestamp = Date.now() - (70 * 1000); // 70 segundos atrás
      const encryptedTimestamp = encriptarMensaje(oldTimestamp.toString());
      
      const response = await request(app)
        .get('/perfil_usuario/datos_usuario')
        .set('timestamp', encryptedTimestamp)
        .set('Cookie', [`jwtToken=${jwtToken}`]);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('code', 'TIMESTAMP_EXPIRED');
    });

    // Este test requiere mock de base de datos o base de datos de prueba
    it.skip('debería retornar datos de usuario con credenciales válidas', async () => {
      const timestamp = encriptarMensaje(Date.now().toString());
      
      const response = await request(app)
        .get('/perfil_usuario/datos_usuario')
        .set('timestamp', timestamp)
        .set('Cookie', [`jwtToken=${jwtToken}`]);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('estado_solicitud', 1);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id_usuario');
    });

    it('debería aplicar rate limiting', async () => {
      const timestamp = encriptarMensaje(Date.now().toString());
      const requests = [];

      // Hacer 61 requests (el límite es 60)
      for (let i = 0; i < 61; i++) {
        requests.push(
          request(app)
            .get('/perfil_usuario/datos_usuario')
            .set('timestamp', timestamp)
            .set('Cookie', [`jwtToken=${jwtToken}`])
        );
      }

      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);

      expect(tooManyRequests.length).toBeGreaterThan(0);
    });

    it('debería rechazar solicitud duplicada (request lock)', async () => {
      const timestamp = encriptarMensaje(Date.now().toString());
      
      // Hacer dos requests simultáneas
      const [response1, response2] = await Promise.all([
        request(app)
          .get('/perfil_usuario/datos_usuario')
          .set('timestamp', timestamp)
          .set('Cookie', [`jwtToken=${jwtToken}`]),
        request(app)
          .get('/perfil_usuario/datos_usuario')
          .set('timestamp', timestamp)
          .set('Cookie', [`jwtToken=${jwtToken}`])
      ]);

      // Una debería ser 429 (Too Many Requests)
      const statuses = [response1.status, response2.status];
      expect(statuses).toContain(429);
    });
  });

  describe('Seguridad de Headers', () => {
    it('debería tener headers de seguridad correctos', async () => {
      const response = await request(app).get('/health');

      expect(response.headers).toHaveProperty('x-content-type-options');
      expect(response.headers).toHaveProperty('x-frame-options');
    });

    it('debería permitir CORS en desarrollo', async () => {
      const response = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');

      expect(response.headers).toHaveProperty('access-control-allow-origin');
    });
  });

  describe('Health Check', () => {
    it('debería retornar status OK', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('environment');
    });
  });

  describe('404 Handler', () => {
    it('debería retornar 404 para rutas inexistentes', async () => {
      const response = await request(app).get('/ruta-que-no-existe');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body.message).toContain('Ruta no encontrada');
    });
  });
});
