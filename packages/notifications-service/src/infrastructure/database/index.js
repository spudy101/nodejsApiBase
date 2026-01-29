// notifications-service/src/infrastructure/database/index.js

/**
 * Database initialization for Notifications Service
 * 
 * Carga todos los modelos del servicio de Notificaciones y establece sus asociaciones.
 * Usa el schema 'notifications' de PostgreSQL.
 */

const fs = require('fs');
const path = require('path');
const { createSequelizeInstance } = require('@abundbank/shared');
const { logger } = require('@abundbank/shared');
const config = require('../../../src/config'); // ← Importa la config del servicio

const SCHEMA_NAME = 'notifications';

// Crear instancia pasando schema y config
const sequelize = createSequelizeInstance(SCHEMA_NAME, config.database);

const db = {};

// Leer todos los archivos de modelos en este directorio
const modelsPath = path.join(__dirname, 'models');
const modelFiles = fs
  .readdirSync(modelsPath)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== 'index.js' &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  });

// Cargar cada modelo
modelFiles.forEach(file => {
  try {
    const model = require(path.join(modelsPath, file))(sequelize);
    db[model.name] = model;
    logger.info(`✅ Model loaded: ${model.name} (schema: ${SCHEMA_NAME})`);
  } catch (error) {
    logger.error(`❌ Error loading model ${file}:`, error);
    throw error;
  }
});

// Establecer asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
      logger.info(`✅ Associations set for: ${modelName}`);
    } catch (error) {
      logger.error(`❌ Error setting associations for ${modelName}:`, error);
      throw error;
    }
  }
});

// Agregar instancia de Sequelize al objeto db
db.sequelize = sequelize;
db.Sequelize = require('sequelize');

// Metadata
db._service = 'notifications-service';
db._schema = SCHEMA_NAME;

logger.info(`🎯 Database initialized for Notifications Service (schema: ${SCHEMA_NAME})`);
logger.info(`📊 Models loaded: ${Object.keys(db).filter(k => k !== 'sequelize' && k !== 'Sequelize' && !k.startsWith('_')).join(', ')}`);

module.exports = db;