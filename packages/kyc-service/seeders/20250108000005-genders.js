// seeders/20250108000005-genders.js
'use strict';
const { v4: uuidv4 } = require('uuid');

const SCHEMA = 'kyc';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingGenders = await queryInterface.sequelize.query(
      `SELECT name FROM "${SCHEMA}"."genders" WHERE name IN (:names)`,
      {
        replacements: { 
          names: ['Masculino', 'Femenino', 'No binario', 'Prefiero no decir'] 
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingGenders.length > 0) {
      console.log('⚠️  Los géneros ya existen, saltando seed...');
      return;
    }

    const genders = [
      'Masculino',
      'Femenino',
      'No binario',
      'Prefiero no decir'
    ];

    await queryInterface.bulkInsert(
      { tableName: 'genders', schema: SCHEMA },
      genders.map(name => ({
        id: uuidv4(),
        name,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })),
      {}
    );

    console.log('✅ Géneros creados exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      { tableName: 'genders', schema: SCHEMA },
      {
        name: ['Masculino', 'Femenino', 'No binario', 'Prefiero no decir']
      },
      {}
    );
  }
};