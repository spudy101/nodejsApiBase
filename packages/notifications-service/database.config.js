// packages/notifications-service/database.config.js
require('dotenv').config();

const SCHEMA = 'notifications';

module.exports = {
  development: {
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'abundbank',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    dialectOptions: {
      prependSearchPath: true
    },
    searchPath: SCHEMA,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      schema: SCHEMA
    },
    logging: process.env.DB_LOGGING === 'true' ? console.log : false
  },

  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false
  },

  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    dialect: process.env.DB_DIALECT,
    dialectOptions: {
      prependSearchPath: true,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    searchPath: SCHEMA,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      schema: SCHEMA
    },
    logging: false
  }
};