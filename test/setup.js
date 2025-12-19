const { sequelize } = require('../src/models');
require('dotenv').config();

process.env.DB_SCHEMA = 'test';

// Configurar variables de entorno para testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'ada38e03ac9ab0b642d95108054612a8367c27dc531690f6d22cfe6917ec951f9f39c164561cfaaaf0bc5d970a61d0ba';
process.env.ENCRYPTION_KEY = 'c246c998bb17893a5580508bc590566c209af1bad16d9d0dbad6a1cfdc48b969';

// Aumentar timeout para operaciones de BD
jest.setTimeout(10000);

// Hooks globales
beforeAll(async () => {
  try {
    // Conectar a BD de test
    await sequelize.authenticate();
    console.log('✅ Conectado a BD de testing');

    // Crear esquema si no existe (para tests)
    await sequelize.createSchema(process.env.DB_SCHEMA, { logging: false }).catch(() => {});
    
    // Sincronizar modelos (crear tablas)
    await sequelize.sync({ force: true });
    console.log('✅ Tablas de testing creadas');
  } catch (error) {
    console.error('❌ Error en setup:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    // Limpiar BD
    await sequelize.drop({ schema: process.env.DB_SCHEMA });
    console.log('✅ Tablas de testing eliminadas');
    
    // Cerrar conexión
    await sequelize.close();
    console.log('✅ Conexión a BD cerrada');
  } catch (error) {
    console.error('❌ Error en cleanup:', error);
  }
});

// Limpiar tablas entre tests
afterEach(async () => {
  try {
    // Truncar todas las tablas
    await sequelize.query(`TRUNCATE TABLE "${process.env.DB_SCHEMA}"."users" CASCADE`);
    await sequelize.query(`TRUNCATE TABLE "${process.env.DB_SCHEMA}"."products" CASCADE`);
    await sequelize.query(`TRUNCATE TABLE "${process.env.DB_SCHEMA}"."login_attempts" CASCADE`);
  } catch (error) {
    // Ignorar errores si las tablas no existen
  }
});