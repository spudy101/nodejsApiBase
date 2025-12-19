// test/integration/helpers/testHelpers.js
const request = require('supertest');
const { User, Product, LoginAttempts } = require('../../../src/models');

/**
 * Crear usuario de prueba en BD
 */
async function createTestUser(userData = {}) {
  const defaultData = {
    email: `test-${Date.now()}@example.com`,
    password: 'Password123',
    name: 'Test User',
    role: 'user',
    isActive: true
  };

  const user = await User.create({ ...defaultData, ...userData });
  return user;
}

/**
 * Crear admin de prueba en BD
 */
async function createTestAdmin(userData = {}) {
  return createTestUser({ 
    role: 'admin', 
    email: `admin-${Date.now()}@example.com`,
    ...userData 
  });
}

/**
 * Crear producto de prueba en BD
 */
async function createTestProduct(userId, productData = {}) {
  const defaultData = {
    name: `Test Product ${Date.now()}`,
    description: 'Test description',
    price: 100000,
    stock: 10,
    category: 'electronics',
    isActive: true,
    createdBy: userId
  };

  const product = await Product.create({ ...defaultData, ...productData });
  return product;
}

/**
 * Login y obtener token
 */
async function loginAndGetToken(app, email, password) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ email, password });

  return response.body.data.token;
}

/**
 * Limpiar base de datos
 */
async function cleanDatabase() {
  await LoginAttempts.destroy({ where: {}, force: true });
  await Product.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
}

/**
 * Crear usuario y hacer login (obtener token)
 */
async function createUserAndLogin(app, userData = {}) {
  const password = 'Password123';
  const user = await createTestUser({ ...userData, password });
  const token = await loginAndGetToken(app, user.email, password);
  
  return { user, token };
}

/**
 * Crear admin y hacer login (obtener token)
 */
async function createAdminAndLogin(app, userData = {}) {
  const password = 'AdminPassword123';
  const admin = await createTestAdmin({ ...userData, password });
  const token = await loginAndGetToken(app, admin.email, password);
  
  return { admin, token };
}

module.exports = {
  createTestUser,
  createTestAdmin,
  createTestProduct,
  loginAndGetToken,
  cleanDatabase,
  createUserAndLogin,
  createAdminAndLogin
};