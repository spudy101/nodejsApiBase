require('dotenv').config();

const { database, server } = require('../shared/constants');

const env = server.nodeEnv;

const baseConfig = {
  development: {
    username: database.user,
    password: database.password,
    database: database.name,
    host: database.host,
    port: database.port,
    dialect: database.dialect,
    dialectOptions: {
      prependSearchPath: true
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    logging: database.logging === 'true' ? console.log : false,
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
      underscored: true,
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
    username: database.user,
    password: database.password,
    database: database.name,
    host: database.host,
    port: database.port,
    dialect: database.dialect,
    dialectOptions: {
      prependSearchPath: true,
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    define: {
      timestamps: true,
      underscored: true,
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