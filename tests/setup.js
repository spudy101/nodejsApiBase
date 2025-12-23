process.env.NODE_ENV = 'test';

// Cargar variables de entorno del .env normal (no necesitas .env.test)
require('dotenv').config();

const { sequelize } = require('../src/models');

// Aumentar timeout
jest.setTimeout(30000);

// Hook global: crear estructura de BD (scope='session' en pytest)
beforeAll(async () => {
  try {
    console.log('🔧 Configurando base de datos de testing...');
    console.log(`📋 Dialect: ${sequelize.getDialect()}`);
    console.log(`📋 Storage: ${sequelize.config.storage || 'N/A'}`);
    
    // Sincronizar modelos (crear tablas)
    await sequelize.sync({ force: true });
    console.log('✅ Base de datos de testing lista');
    
  } catch (error) {
    console.error('❌ Error en setup:', error);
    throw error;
  }
});

// Hook global: cerrar conexión al final
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('✅ Conexión cerrada');
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error);
  }
});

// Limpiar datos entre tests (scope='function' en pytest)
afterEach(async () => {
  try {
    // Obtener todos los modelos
    const models = Object.values(sequelize.models);
    
    // Truncar todas las tablas
    // Para SQLite esto es rápido, no necesitas desactivar constraints
    for (const model of models) {
      await model.destroy({ 
        where: {}, 
        truncate: true,
        cascade: true,
        restartIdentity: true 
      });
    }
  } catch (error) {
    // Ignorar errores si no hay datos
    if (!error.message.includes('no such table')) {
      console.warn('⚠️  Error limpiando datos:', error.message);
    }
  }
});