require('dotenv').config();

const PORT = process.env.PORT || 3000;

const app = require('./src/app');
const { initializeDatabase, closeConnection } = require('./src/database/connection');

const startServer = async () => {
  try {
    const dbReady = await initializeDatabase();
    if (!dbReady) {
      throw new Error('No se pudo conectar a la base de datos');
    }
    
    // ✅ USAR LA VARIABLE PORT
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al inicializar:', error.message);
    process.exit(1);
  }
};

startServer();

module.exports = { app };
