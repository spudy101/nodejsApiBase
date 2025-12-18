// tests/setup.js
// Configuración global para todos los tests

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.DB_HOST = 'localhost';
process.env.DB_USER = 'test_user';
process.env.DB_PASSWORD = 'test_password';
process.env.DB_NAME = 'test_database';
process.env.DB_PORT = '3306';
process.env.SECRET_JWT_KEY = 'test-secret-key-for-jwt';
process.env.KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'; // 64 chars hex
process.env.IV = '0123456789abcdef0123456789abcdef'; // 32 chars hex

// Timeout global para tests
jest.setTimeout(10000);

// Mock console para tests más limpios (opcional)
global.console = {
  ...console,
  log: jest.fn(), // Silenciar logs en tests
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Cleanup después de cada test
afterEach(() => {
  jest.clearAllMocks();
});
