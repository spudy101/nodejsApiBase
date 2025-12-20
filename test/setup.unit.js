// test/setup.unit.js
require('dotenv').config();

// CRÍTICO: Verificar que estamos en entorno de test
if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    '⚠️  PELIGRO: Intentando ejecutar tests fuera del entorno TEST!\n' +
    'Asegúrate de ejecutar con: NODE_ENV=test npm test'
  );
}

// Mock del logger para tests unitarios
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Aumentar timeout
jest.setTimeout(5000); // Menos tiempo que integración