require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      prependSearchPath: true
    },
    schema: process.env.DB_SCHEMA || 'public',  // ← Usa variable
    define: {
      schema: process.env.DB_SCHEMA || 'public',
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  test: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      prependSearchPath: true
    },
    schema: process.env.DB_SCHEMA || 'test',
    define: {
      schema: process.env.DB_SCHEMA || 'test',
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    dialectOptions: {
      prependSearchPath: true
    },
    schema: process.env.DB_SCHEMA || 'public',
    define: {
      schema: process.env.DB_SCHEMA || 'public',
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
};