const { Sequelize } = require('sequelize');
const sequelize = require('../config/database');

const db = {
  sequelize,
  Sequelize
};

// Importar modelos
db.User = require('./User')(sequelize);
db.Product = require('./Product')(sequelize);
db.LoginAttempts = require('./LoginAttempts')(sequelize);

// Configurar asociaciones
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;