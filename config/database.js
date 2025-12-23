require('dotenv').config();

const env = process.env.NODE_ENV || 'development';

const baseConfig = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
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
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  // 🎯 Tests: SQLite en memoria (como Flask)
  test: {
    dialect: 'sqlite',
    storage: ':memory:',
    logging: false,
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    },
    pool: {
      max: 1,
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
    dialect: process.env.DB_DIALECT,
    dialectOptions: {
      prependSearchPath: true,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
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
      max: 10,
      min: 2,
      acquire: 30000,
      idle: 10000
    }
  }
};

module.exports = baseConfig;
module.exports[env] = baseConfig[env];