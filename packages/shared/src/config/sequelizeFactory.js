// shared/src/config/sequelizeFactory.js

const { Sequelize } = require('sequelize');

/**
 * Crea una instancia de Sequelize para un schema específico
 * @param {string} schema - Nombre del schema (ej: 'kyc', 'notifications')
 * @param {object} dbConfig - Configuración de base de datos del servicio
 * @returns {Sequelize} - Instancia de Sequelize configurada
 */
const createSequelizeInstance = (schema, dbConfig) => {
  if (!schema) {
    throw new Error('Schema name is required for createSequelizeInstance');
  }

  if (!dbConfig) {
    throw new Error('Database config is required for createSequelizeInstance');
  }

  const env = process.env.NODE_ENV || 'development';

  // Configuración base según ambiente
  const config = {
    username: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.name,
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    dialectOptions: {
      prependSearchPath: true,
      ...(env === 'production' && {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      })
    },
    searchPath: schema,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      schema: schema
    },
    logging: dbConfig.logging ? console.log : false,
    pool: {
      max: env === 'production' ? 10 : 5,
      min: env === 'production' ? 2 : 0,
      acquire: 30000,
      idle: 10000
    }
  };

  // Crear instancia de Sequelize
  const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  );

  // Metadata para debugging
  sequelize._schemaName = schema;
  sequelize._environment = env;

  return sequelize;
};

module.exports = {
  createSequelizeInstance
};