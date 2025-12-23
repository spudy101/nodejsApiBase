process.env.NODE_ENV = 'test';
require('dotenv').config();

// Mock del logger
jest.mock('../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn()
}));

jest.setTimeout(5000);