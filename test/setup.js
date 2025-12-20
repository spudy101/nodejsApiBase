// Cargar .env.test PRIMERO
require('dotenv').config({ path: '.env.test' });

const { sequelize } = require('../src/models');

// CRÍTICO: Verificar que estamos en entorno de test
if (process.env.NODE_ENV !== 'test') {
  throw new Error(
    '⚠️ PELIGRO: Intentando ejecutar tests fuera del entorno TEST!\n' +
    `NODE_ENV actual: ${process.env.NODE_ENV}\n` +
    'Asegúrate de ejecutar con: npm test'
  );
}

// CRÍTICO: Verificar que el schema sea el de test
const testSchema = process.env.DB_SCHEMA || 'test_schema';
const FORBIDDEN_SCHEMAS = ['public', 'app_schema', 'prod', 'production'];

if (FORBIDDEN_SCHEMAS.includes(testSchema)) {
  throw new Error(
    '🚨 PELIGRO: Intentando usar un schema prohibido para tests!\n' +
    `Schema actual: ${testSchema}\n` +
    `Schemas prohibidos: ${FORBIDDEN_SCHEMAS.join(', ')}\n` +
    'Verifica tu .env.test'
  );
}

// Aumentar timeout para operaciones de BD
jest.setTimeout(30000);

// Variable global para tracking
let schemaCreated = false;

// Hooks globales
beforeAll(async () => {
  try {
    // Verificar conexión
    await sequelize.authenticate();
    console.log(`✅ Conectado a BD de testing`);
    
    // Verificar que estamos usando la BD/schema correctos
    const dbName = sequelize.config.database;
    const currentSchema = sequelize.config.schema || testSchema;
    
    console.log(`📋 Base de datos: ${dbName}`);
    console.log(`📋 Schema: ${currentSchema}`);
    
    // Doble verificación de seguridad
    if (FORBIDDEN_SCHEMAS.includes(currentSchema)) {
      throw new Error(
        `🚨 PELIGRO: Estás usando un schema prohibido!\n` +
        `Schema actual: ${currentSchema}\n` +
        `Este schema NO debe usarse para tests`
      );
    }

    // Crear schema si no existe
    try {
      await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${testSchema}"`);
      console.log(`✅ Schema "${testSchema}" verificado/creado`);
      schemaCreated = true;
    } catch (error) {
      console.warn('⚠️ Schema ya existe o no se pudo crear:', error.message);
    }
    
    // Establecer search_path al schema de test
    await sequelize.query(`SET search_path TO "${testSchema}"`);
    console.log(`✅ search_path establecido a "${testSchema}"`);
    
    // Sincronizar modelos (crear/recrear tablas)
    // force: true elimina y recrea las tablas SOLO en el schema de test
    await sequelize.sync({ force: true });
    console.log('✅ Tablas de testing sincronizadas');
    
  } catch (error) {
    console.error('❌ Error en setup de tests:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // SOLO limpiar el schema de test, NUNCA el productivo
    if (schemaCreated && testSchema && !FORBIDDEN_SCHEMAS.includes(testSchema)) {
      console.log(`🧹 Limpiando schema de test "${testSchema}"...`);
      
      // Opción 1: Eliminar todas las tablas del schema (más seguro)
      const [tables] = await sequelize.query(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = '${testSchema}'
      `);
      
      for (const { tablename } of tables) {
        await sequelize.query(`DROP TABLE IF EXISTS "${testSchema}"."${tablename}" CASCADE`);
      }
      console.log(`✅ Tablas del schema "${testSchema}" eliminadas`);
      
      // Opción 2 (comentada): Eliminar el schema completo
      // await sequelize.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE`);
      // console.log(`✅ Schema "${testSchema}" eliminado`);
    }
    
    // Cerrar conexión
    await sequelize.close();
    console.log('✅ Conexión a BD cerrada');
    
  } catch (error) {
    console.error('❌ Error en cleanup:', error);
  }
});

// Limpiar tablas entre tests (más eficiente que destroy)
afterEach(async () => {
  try {
    // Obtener todos los modelos dinámicamente
    const models = Object.keys(sequelize.models);
    
    // Deshabilitar triggers y constraints temporalmente para truncate más rápido
    await sequelize.query(`SET session_replication_role = 'replica'`);
    
    // Truncar todas las tablas
    for (const modelName of models) {
      const model = sequelize.models[modelName];
      const tableName = model.getTableName();
      
      // Si tableName es un objeto (tiene schema), usar ambos
      if (typeof tableName === 'object') {
        await sequelize.query(
          `TRUNCATE TABLE "${tableName.schema}"."${tableName.tableName}" RESTART IDENTITY CASCADE`
        );
      } else {
        await sequelize.query(
          `TRUNCATE TABLE "${testSchema}"."${tableName}" RESTART IDENTITY CASCADE`
        );
      }
    }
    
    // Rehabilitar triggers y constraints
    await sequelize.query(`SET session_replication_role = 'origin'`);
    
  } catch (error) {
    // Ignorar errores si las tablas no existen todavía
    if (!error.message.includes('does not exist')) {
      console.warn('⚠️ Error en limpieza entre tests:', error.message);
    }
  }
});