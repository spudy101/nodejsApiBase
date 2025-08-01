require('dotenv').config();

const requiredEnvVars = ['DB_USER', 'DB_PASSWORD', 'DB_NAME', 'DB_HOST'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingEnvVars);
  process.exit(1);
}

// CONFIGURACIÓN BASE PARA AURORA SERVERLESS
const baseConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 3306,
  dialect: 'mysql',
  
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 30000,
    evict: 10000,
    handleDisconnects: true,
    maxUses: 100,
    maxWaitingClients: 50
  },
  
  dialectOptions: {
    charset: 'utf8mb4',
    connectTimeout: 30000,
    supportBigNumbers: true,
    bigNumberStrings: true,
    dateStrings: false,
    debug: false,
    multipleStatements: false
  },
  
  retry: {
    max: 3,
    backoffBase: 1000,
    backoffExponent: 2
  },

  benchmark: false,
  omitNull: true,
  logging: false,
  
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
    paranoid: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  
  isolationLevel: 'READ_COMMITTED',
  transactionType: 'IMMEDIATE'
};

module.exports = {
  development: {
    ...baseConfig,
    logging: true,
    benchmark: true
  },
  
  production: {
    ...baseConfig,
    logging: false,
    benchmark: false
  }
};