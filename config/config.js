// config.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const env = process.env.NODE_ENV || 'development';
const config = require('./database')[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config  // ← Pasa toda la configuración
);

module.exports = sequelize;