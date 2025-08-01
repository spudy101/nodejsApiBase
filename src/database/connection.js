const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'production';
const dbConfig = config[env];

if (!dbConfig) {
  console.error(`❌ Configuración no encontrada para entorno: ${env}`);
  process.exit(1);
}

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    ...dbConfig,
    
    logging: process.env.DB_DEBUG === 'true' ? ((sql, timing) => {
      console.log(`🔍 [DB] ${sql}`);
      if (timing) console.log(`⏱️  [DB] Executed in ${timing}ms`);
      
      if (sequelize?.connectionManager?.pool) {
        const pool = sequelize.connectionManager.pool;
        console.log(`📊 [POOL] Size: ${pool.size}, Available: ${pool.available}, Pending: ${pool.pending}`);
      }
    }) : dbConfig.logging
  }
);

if (process.env.DB_DEBUG === 'true') {
  sequelize.addHook('beforeConnect', (config) => {
    console.log(`🔄 [${new Date().toISOString()}] Conectando a BD: ${config.database}@${config.host}:${config.port}`);
  });

  sequelize.addHook('afterConnect', (connection, config) => {
    console.log(`✅ [${new Date().toISOString()}] Conexión establecida - Thread: ${connection.threadId || 'N/A'}`);
  });

  sequelize.addHook('beforeDisconnect', (connection) => {
    console.log(`❌ [${new Date().toISOString()}] Desconectando - Thread: ${connection.threadId || 'N/A'}`);
  });
}

const testConnection = async () => {
  const startTime = Date.now();
  
  try {
    console.log(`🔍 [${new Date().toISOString()}] Probando conexión a BD...`);
    
    await sequelize.authenticate();
    
    const connectionTime = Date.now() - startTime;
    console.log(`✅ [${new Date().toISOString()}] Conexión exitosa en ${connectionTime}ms`);
    console.log(`📍 Entorno: ${env}`);
    console.log(`🗄️  Base de datos: ${dbConfig.database}`);
    console.log(`🌐 Host: ${dbConfig.host}:${dbConfig.port}`);
    
    return { success: true, connectionTime };
  } catch (error) {
    const connectionTime = Date.now() - startTime;
    console.error(`❌ [${new Date().toISOString()}] Error de conexión (${connectionTime}ms):`, {
      message: error.message,
      code: error.original?.code,
      errno: error.original?.errno,
      sqlState: error.original?.sqlState,
      host: dbConfig.host,
      database: dbConfig.database
    });
    
    return { success: false, error: error.message, connectionTime };
  }
};

const initializeDatabase = async () => {
  try {
    // 1. Probar conexión
    const connectionResult = await testConnection();
    if (!connectionResult.success) {
      throw new Error(`Fallo en prueba de conexión: ${connectionResult.error}`);
    }
    
    // 2. DESACTIVAR SYNC AUTOMÁTICO (IMPORTANTE)
    // ❌ NUNCA usar sync en producción
    // ❌ NUNCA usar alter: true con datos reales
    if (env === 'development' && process.env.DB_FORCE_SYNC === 'true') {
      console.log('⚠️  ADVERTENCIA: Sincronización forzada activada');
      console.log('🔄 Esto puede modificar la estructura de la BD');
      await sequelize.sync({ force: false, alter: false }); // Más seguro
      console.log('✅ Modelos sincronizados (sin alteraciones)');
    }
    
    console.log(`🎉 Base de datos inicializada correctamente`);
    return true;
  } catch (error) {
    console.error('❌ Error al inicializar base de datos:', error.message);
    return false;
  }
};

const closeConnection = async () => {
  try {
    console.log('🔄 Cerrando conexión a base de datos...');
    await sequelize.close();
    console.log('✅ Conexión cerrada correctamente');
  } catch (error) {
    console.error('❌ Error al cerrar conexión:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection,
  initializeDatabase,
  closeConnection,
  
  // Para mantener compatibilidad
  Sequelize
};