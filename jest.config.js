module.exports = {
  testEnvironment: 'node',
  coverageProvider: 'v8',
  
  // Configuración de cobertura
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 75,
      lines: 80
    }
  },

  // IMPORTANTE: Diferentes configuraciones para diferentes tipos de tests
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/test/unit/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/test/setup.unit.js'], // ✅ Setup sin BD
    },
    {
      displayName: 'integration',
      testMatch: ['**/test/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/test/setup.js'], // ✅ Setup con BD
    }
  ]
};