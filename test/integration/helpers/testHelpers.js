// test/integration/helpers/testHelpers.js
const request = require('supertest');
const { User, Product, LoginAttempts, sequelize } = require('../../../src/models');

// Lista de schemas prohibidos para tests
const FORBIDDEN_SCHEMAS = ['public', 'app_schema', 'prod', 'production'];

/**
 * Verificar que estamos en entorno de test
 */
function verifyTestEnvironment() {
  const dbName = sequelize.config.database;
  const schema = sequelize.config.schema || process.env.DB_SCHEMA;
  const testSchema = process.env.DB_SCHEMA || 'test_schema';
  
  // Verificar NODE_ENV
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      `🚨 PELIGRO: NODE_ENV debe ser 'test', actual: '${process.env.NODE_ENV}'`
    );
  }
  
  // Verificar schema prohibido
  if (FORBIDDEN_SCHEMAS.includes(schema)) {
    throw new Error(
      `🚨 PELIGRO: Estás usando un schema prohibido para tests!\n` +
      `Schema actual: ${schema}\n` +
      `Schemas prohibidos: ${FORBIDDEN_SCHEMAS.join(', ')}`
    );
  }
  
  console.log(`✅ Usando BD de test: ${dbName}, Schema: ${schema}`);
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
 * Limpiar base de datos - VERSIÓN SEGURA
 * Solo limpia si estamos en el entorno de test
 */
async function cleanDatabase() {
  // Verificar entorno antes de limpiar
  verifyTestEnvironment();
  
  // Obtener el schema de test
  const testSchema = process.env.DB_SCHEMA || 'test_schema';
  
  try {
    // Deshabilitar temporalmente constraints para limpieza más rápida
    await sequelize.query(`SET session_replication_role = 'replica'`);
    
    // Método 1: Usando los modelos (más seguro, respeta el schema configurado)
    // El orden importa para respetar foreign keys
    await LoginAttempts.destroy({ where: {}, truncate: true, cascade: true });
    await Product.destroy({ where: {}, truncate: true, cascade: true });
    await User.destroy({ where: {}, truncate: true, cascade: true });
    
    // Rehabilitar constraints
    await sequelize.query(`SET session_replication_role = 'origin'`);
    
  } catch (error) {
    // Rehabilitar constraints en caso de error
    await sequelize.query(`SET session_replication_role = 'origin'`).catch(() => {});
    
    // Si falla destroy, intentar TRUNCATE directo
    try {
      await sequelize.query(`TRUNCATE TABLE "${testSchema}"."login_attempts" RESTART IDENTITY CASCADE`);
      await sequelize.query(`TRUNCATE TABLE "${testSchema}"."products" RESTART IDENTITY CASCADE`);
      await sequelize.query(`TRUNCATE TABLE "${testSchema}"."users" RESTART IDENTITY CASCADE`);
    } catch (truncateError) {
      // Ignorar si las tablas no existen
      if (!truncateError.message.includes('does not exist')) {
        console.warn('⚠️ Error en cleanDatabase:', truncateError.message);
      }
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
    if (!error.message.includes('does not exist')) {
      console.warn(`⚠️ Error limpiando tabla ${model.name}:`, error.message);
    }
  }
}

/**
 * Crear usuario y hacer login (obtener token)
 */
async function createUserAndLogin(app, userData = {}) {
  const password = userData.password || 'Password123';
  const user = await createTestUser({ ...userData, password });
  
  // Necesitamos usar la contraseña original, no la hasheada
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
 * Útil para tests que necesitan transacciones pero no quieren persistir datos
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
  const testSchema = process.env.DB_SCHEMA || 'test_schema';
  
  const [tables] = await sequelize.query(`
    SELECT 
      tablename,
      schemaname
    FROM pg_tables 
    WHERE schemaname = '${testSchema}'
    ORDER BY tablename
  `);
  
  const stats = {};
  for (const { tablename } of tables) {
    const [result] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM "${testSchema}"."${tablename}"
    `);
    stats[tablename] = parseInt(result[0].count);
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