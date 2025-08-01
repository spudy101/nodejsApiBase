const { Sequelize } = require('sequelize');
const { sequelize } = require('../database/connection');
const initModels = require('./init-models');

// Inicializar modelos y asociaciones automáticas
const db = initModels(sequelize);

// Agregar objetos de Sequelize al objeto db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
