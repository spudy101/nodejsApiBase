// config.js
const { Sequelize } = require('sequelize');
require('dotenv').config();
const { server } = require('../shared/constants');

const env = server.nodeEnv;
const config = require('./database')[env];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config  // ← Pasa toda la configuración
);

module.exports = sequelize;