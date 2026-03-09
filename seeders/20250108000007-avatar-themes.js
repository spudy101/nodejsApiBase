// seeders/20250108000007-avatar-themes.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existing = await queryInterface.sequelize.query(
      `SELECT name FROM "${SCHEMA}"."avatar_themes" WHERE name IN (:names)`,
      {
        replacements: { names: ['Animales', 'Abstracto', 'Superhéroes', 'Naturaleza', 'Profesiones'] },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (existing.length > 0) {
      console.log('⚠️  Las temáticas de avatares ya existen, saltando seed...');
      return;
    }

    const themes = ['Animales', 'Abstracto', 'Superhéroes', 'Naturaleza', 'Profesiones'];

    await queryInterface.bulkInsert(
      { tableName: 'avatar_themes', schema: SCHEMA },
      themes.map(name => ({
        id: uuidv4(),
        name,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {}
    );

    console.log('✅ Temáticas de avatares creadas exitosamente');
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete(
      { tableName: 'avatar_themes', schema: SCHEMA },
      { name: ['Animales', 'Abstracto', 'Superhéroes', 'Naturaleza', 'Profesiones'] },
      {}
    );
  },
};