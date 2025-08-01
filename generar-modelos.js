require('dotenv').config();
const SequelizeAuto = require('sequelize-auto');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando generación de modelos...');
console.log(`📍 Base de datos: ${process.env.DB_NAME}@${process.env.DB_HOST}`);

const auto = new SequelizeAuto(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    
    directory: path.join(__dirname, 'src/models'),
    caseFile: 'p',
    caseModel: 'p',
    caseProp: 's',
    
    singularize: false,
    useDefine: true,
    
    additional: {
      timestamps: false,
      paranoid: false,
      underscored: true,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    
    relations: true,
    noAssociations: false,
    noInitModels: false,
    
    useIndexes: true,
    noAlias: true,
    noChangeFields: true,
    
    tables: null,
    skipTables: [
      'migrations',
      'seeders',
      'sessions'
    ],

    lang: 'es'
  }
);

auto.run()
  .then(data => {
    console.log('✅ Modelos generados exitosamente!');
    console.log(`📊 Tablas procesadas: ${Object.keys(data.tables).length}`);
    console.log(`📁 Modelos creados en: ${path.join(__dirname, 'src/models')}`);
    
    // 📝 MOSTRAR RESUMEN
    console.log('\n📋 Archivos generados:');
    Object.keys(data.tables).forEach(table => {
      console.log(`   - ${table}.js (modelo individual)`);
    });
    console.log(`   - init-models.js (asociaciones automáticas FK)`);
    console.log(`   - index.js (archivo principal)`);
    
    // 🔧 GENERAR ARCHIVO DE ÍNDICE
    generateIndexFile();
    
    console.log('\n🎉 ¡Generación completada!');
    console.log('🔗 Las foreign keys se detectaron automáticamente en init-models.js');
    console.log('💡 Usa: const { User, Product } = require("./src/models"); para importar');
  })
  .catch(err => {
    console.error('❌ Error al generar modelos:', err.message);
    console.error('🔍 Detalles del error:', err);
    process.exit(1);
  });

// 🔧 FUNCIÓN PARA GENERAR ARCHIVO DE ÍNDICE COMPATIBLE
function generateIndexFile() {
  const modelsDir = path.join(__dirname, 'src/models');
  
  try {
    // Generar index.js que usa init-models.js (como tu estructura actual)
    const indexContent = `// src/models/index.js - GENERADO AUTOMÁTICAMENTE
      const { Sequelize } = require('sequelize');
      const { sequelize } = require('../database/connection');
      const initModels = require('./init-models');

      // Inicializar modelos y asociaciones automáticas
      const db = initModels(sequelize);

      // Agregar objetos de Sequelize al objeto db
      db.sequelize = sequelize;
      db.Sequelize = Sequelize;

      module.exports = db;
    `;
    
    // Escribir archivo index.js
    fs.writeFileSync(path.join(modelsDir, 'index.js'), indexContent);
    console.log('✅ Archivo index.js generado (compatible con init-models.js)');
    
  } catch (error) {
    console.warn('⚠️  No se pudo generar index.js:', error.message);
  }
}