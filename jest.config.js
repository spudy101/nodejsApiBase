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

  // Proyectos separados: unit (sin BD) vs integration (con BD)
  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/tests/unit/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.unit.js'], // Sin BD
    },
    {
      displayName: 'integration',
      testMatch: ['**/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'], // Con BD SQLite
    }
  ]
};