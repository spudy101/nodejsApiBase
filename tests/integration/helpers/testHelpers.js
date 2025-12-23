// tests/integration/helpers/testHelpers.js
const request = require('supertest');
const { User, Product, LoginAttempts, sequelize } = require('../../../src/models');

/**
 * Verificar que estamos en entorno de test
 */
function verifyTestEnvironment() {
  const dialect = sequelize.getDialect();
  
  // Verificar NODE_ENV
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      `🚨 PELIGRO: NODE_ENV debe ser 'test', actual: '${process.env.NODE_ENV}'`
    );
  }
  
  // Verificar que estamos usando SQLite
  if (dialect !== 'sqlite') {
    throw new Error(
      `🚨 PELIGRO: Los tests deben usar SQLite, dialect actual: '${dialect}'`
    );
  }
  
  console.log(`✅ Usando BD de test: SQLite en memoria`);
}

/**
 * Crear usuario de prueba en BD
 */
async function createTestUser(userData = {}) {
  const defaultData = {
    email: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
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
    email: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
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

  if (response.status !== 200) {
    throw new Error(`Login failed: ${response.status} - ${JSON.stringify(response.body)}`);
  }

  return response.body.data.token;
}

/**
 * Limpiar base de datos - VERSIÓN SIMPLIFICADA PARA SQLITE
 */
async function cleanDatabase() {
  // Verificar entorno antes de limpiar
  verifyTestEnvironment();
  
  try {
    // Limpiar en orden (respetar foreign keys)
    await LoginAttempts.destroy({ where: {}, truncate: true, cascade: true });
    await Product.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
  } catch (error) {
    // Ignorar si las tablas no existen
    if (!error.message.includes('no such table')) {
      console.warn('⚠️  Error en cleanDatabase:', error.message);
    }
  }
}

/**
 * Limpiar una tabla específica
 */
async function cleanTable(model) {
  verifyTestEnvironment();
  
  try {
    await model.destroy({ 
      where: {}, 
      truncate: true, 
      cascade: true,
      restartIdentity: true 
    });
  } catch (error) {
    if (!error.message.includes('no such table')) {
      console.warn(`⚠️  Error limpiando tabla ${model.name}:`, error.message);
    }
  }
}

/**
 * Crear usuario y hacer login (obtener token)
 */
async function createUserAndLogin(app, userData = {}) {
  const password = userData.password || 'Password123';
  const user = await createTestUser({ ...userData, password });
  
  const token = await loginAndGetToken(app, user.email, password);
  
  return { user, token, password };
}

/**
 * Crear admin y hacer login (obtener token)
 */
async function createAdminAndLogin(app, userData = {}) {
  const password = userData.password || 'AdminPassword123';
  const admin = await createTestAdmin({ ...userData, password });
  const token = await loginAndGetToken(app, admin.email, password);
  
  return { admin, token, password };
}

/**
 * Crear múltiples usuarios de prueba
 */
async function createMultipleUsers(count = 5, baseData = {}) {
  const users = [];
  for (let i = 0; i < count; i++) {
    const user = await createTestUser({
      name: `Test User ${i + 1}`,
      email: `test-user-${i + 1}-${Date.now()}@example.com`,
      ...baseData
    });
    users.push(user);
  }
  return users;
}

/**
 * Crear múltiples productos de prueba
 */
async function createMultipleProducts(userId, count = 5, baseData = {}) {
  const products = [];
  for (let i = 0; i < count; i++) {
    const product = await createTestProduct(userId, {
      name: `Test Product ${i + 1}`,
      price: (i + 1) * 10000,
      ...baseData
    });
    products.push(product);
  }
  return products;
}

/**
 * Seed data completo para tests
 */
async function seedTestData() {
  verifyTestEnvironment();
  
  // Crear usuarios de ejemplo
  const admin = await createTestAdmin({
    email: 'admin@test.com',
    name: 'Test Admin'
  });
  
  const user1 = await createTestUser({
    email: 'user1@test.com',
    name: 'Test User 1'
  });
  
  const user2 = await createTestUser({
    email: 'user2@test.com',
    name: 'Test User 2'
  });
  
  // Crear productos de ejemplo
  const products = await createMultipleProducts(admin.id, 3, {
    category: 'electronics'
  });
  
  return {
    admin,
    users: [user1, user2],
    products
  };
}

/**
 * Ejecutar función dentro de una transacción con rollback
 */
async function withTransaction(callback) {
  const transaction = await sequelize.transaction();
  try {
    const result = await callback(transaction);
    return result;
  } finally {
    await transaction.rollback();
  }
}

/**
 * Generar email único para tests
 */
function generateTestEmail(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`;
}

/**
 * Obtener estadísticas de la BD (útil para debugging)
 */
async function getDatabaseStats() {
  const models = Object.keys(sequelize.models);
  const stats = {};
  
  for (const modelName of models) {
    const model = sequelize.models[modelName];
    const count = await model.count();
    stats[modelName] = count;
  }
  
  return stats;
}

module.exports = {
  // Verificación
  verifyTestEnvironment,
  
  // Creación de datos
  createTestUser,
  createTestAdmin,
  createTestProduct,
  createMultipleUsers,
  createMultipleProducts,
  
  // Autenticación
  loginAndGetToken,
  createUserAndLogin,
  createAdminAndLogin,
  
  // Limpieza
  cleanDatabase,
  cleanTable,
  
  // Seeding
  seedTestData,
  
  // Transacciones
  withTransaction,
  
  // Utilidades
  generateTestEmail,
  getDatabaseStats
};