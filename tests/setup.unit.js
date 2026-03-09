process.env.NODE_ENV = 'test';
require('dotenv').config();

// Mock global del logger — aplica a todos los unit tests
jest.mock('./shared/utils/logger.util', () => ({
  logger: {
    info:  jest.fn(),
    error: jest.fn(),
    warn:  jest.fn(),
    debug: jest.fn(),
  },
}));

jest.setTimeout(5000);
