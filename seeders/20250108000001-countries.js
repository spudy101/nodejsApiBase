// seeders/20250108000001-countries.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existing = await queryInterface.sequelize.query(
      `SELECT code FROM "${SCHEMA}"."countries" WHERE code IN (:codes)`,
      {
        replacements: { codes: ['COL', 'USA', 'MEX', 'ARG', 'CHL', 'PER', 'BRA', 'ESP'] },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (existing.length > 0) {
      console.log('⚠️  Los países ya existen, saltando seed...');
      return;
    }

    const countries = [
      { name: 'Colombia',        code: 'COL', icon_url: 'https://flagcdn.com/co.svg' },
      { name: 'Estados Unidos',  code: 'USA', icon_url: 'https://flagcdn.com/us.svg' },
      { name: 'México',          code: 'MEX', icon_url: 'https://flagcdn.com/mx.svg' },
      { name: 'Argentina',       code: 'ARG', icon_url: 'https://flagcdn.com/ar.svg' },
      { name: 'Chile',           code: 'CHL', icon_url: 'https://flagcdn.com/cl.svg' },
      { name: 'Perú',            code: 'PER', icon_url: 'https://flagcdn.com/pe.svg' },
      { name: 'Brasil',          code: 'BRA', icon_url: 'https://flagcdn.com/br.svg' },
      { name: 'España',          code: 'ESP', icon_url: 'https://flagcdn.com/es.svg' },
    ];

    await queryInterface.bulkInsert(
      { tableName: 'countries', schema: SCHEMA },
      countries.map(c => ({
        id: uuidv4(),
        ...c,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {}
    );

    console.log('✅ Países creados exitosamente');
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete(
      { tableName: 'countries', schema: SCHEMA },
      { code: ['COL', 'USA', 'MEX', 'ARG', 'CHL', 'PER', 'BRA', 'ESP'] },
      {}
    );
  },
};