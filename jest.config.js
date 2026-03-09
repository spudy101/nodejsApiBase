module.exports = {
  testEnvironment: 'node',
  coverageProvider: 'v8',

  collectCoverageFrom: [
    'modules/**/*.js',
    '!modules/**/*.test.js',
    '!modules/**/__tests__/**',
    '!modules/**/dtos/**',
    '!modules/**/migrations/**',
    '!modules/**/seeders/**',
  ],

  coverageThreshold: {
    global: {
      statements: 80,
      branches:   70,
      functions:  75,
      lines:      80,
    },
  },

  projects: [
    {
      displayName: 'unit',
      testMatch:   ['**/tests/unit/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.unit.js'],
    },
    {
      displayName: 'integration',
      testMatch:   ['**/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    },
  ],
};
