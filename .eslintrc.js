module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    // Customizar reglas según el estilo del proyecto
    'no-console': 'off', // Permitir console.log en desarrollo
    'no-underscore-dangle': 'off', // Permitir _privateMethod
    'class-methods-use-this': 'off', // No forzar uso de this
    'consistent-return': 'off',
    'no-param-reassign': ['error', { props: false }],
    'max-len': ['error', { code: 120, ignoreComments: true }],
    'import/no-extraneous-dependencies': ['error', {
      devDependencies: [
        '**/*.test.js',
        '**/*.spec.js',
        '**/tests/**',
      ],
    }],
  },
};
