// seeders/20250108000001-countries.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { database } = require('../shared/constants');

const SCHEMA = database.schema;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingCountries = await queryInterface.sequelize.query(
      `SELECT code FROM "${SCHEMA}"."countries" WHERE code IN (:codes)`,
      {
        replacements: { 
          codes: ['COL', 'USA', 'MEX', 'ARG', 'CHL', 'PER', 'BRA', 'ESP'] 
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingCountries.length > 0) {
      console.log('⚠️  Los países ya existen, saltando seed...');
      return;
    }

    const countries = [
      { country_id: uuidv4(), name: 'Colombia', code: 'COL', icon_url: 'https://flagcdn.com/co.svg' },
      { country_id: uuidv4(), name: 'Estados Unidos', code: 'USA', icon_url: 'https://flagcdn.com/us.svg' },
      { country_id: uuidv4(), name: 'México', code: 'MEX', icon_url: 'https://flagcdn.com/mx.svg' },
      { country_id: uuidv4(), name: 'Argentina', code: 'ARG', icon_url: 'https://flagcdn.com/ar.svg' },
      { country_id: uuidv4(), name: 'Chile', code: 'CHL', icon_url: 'https://flagcdn.com/cl.svg' },
      { country_id: uuidv4(), name: 'Perú', code: 'PER', icon_url: 'https://flagcdn.com/pe.svg' },
      { country_id: uuidv4(), name: 'Brasil', code: 'BRA', icon_url: 'https://flagcdn.com/br.svg' },
      { country_id: uuidv4(), name: 'España', code: 'ESP', icon_url: 'https://flagcdn.com/es.svg' }
    ];

    await queryInterface.bulkInsert(
      { tableName: 'countries', schema: SCHEMA },
      countries.map(country => ({
        ...country,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })),
      {}
    );

    console.log('✅ Países creados exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      { tableName: 'countries', schema: SCHEMA },
      {
        code: ['COL', 'USA', 'MEX', 'ARG', 'CHL', 'PER', 'BRA', 'ESP']
      },
      {}
    );
  }
};