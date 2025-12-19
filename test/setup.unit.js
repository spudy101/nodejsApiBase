// test/setup.unit.js
require('dotenv').config();

// Variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'ada38e03ac9ab0b642d95108054612a8367c27dc531690f6d22cfe6917ec951f9f39c164561cfaaaf0bc5d970a61d0ba';
process.env.ENCRYPTION_KEY = 'c246c998bb17893a5580508bc590566c209af1bad16d9d0dbad6a1cfdc48b969';

// Mock del logger para tests unitarios
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

// Aumentar timeout
jest.setTimeout(5000); // Menos tiempo que integración