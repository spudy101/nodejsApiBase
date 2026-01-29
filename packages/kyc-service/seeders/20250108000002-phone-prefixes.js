// seeders/20250108000002-phone-prefixes.js
'use strict';
const { v4: uuidv4 } = require('uuid');

const SCHEMA = 'kyc';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingPrefixes = await queryInterface.sequelize.query(
      `SELECT prefix FROM "${SCHEMA}"."phone_prefixes" WHERE prefix IN (:prefixes)`,
      {
        replacements: { 
          prefixes: ['+57', '+1', '+52', '+54', '+56', '+51', '+55', '+34'] 
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingPrefixes.length > 0) {
      console.log('⚠️  Los prefijos telefónicos ya existen, saltando seed...');
      return;
    }

    // Obtener países para relacionar
    const countries = await queryInterface.sequelize.query(
      `SELECT id, code FROM "${SCHEMA}"."countries"`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const countryMap = {};
    countries.forEach(c => countryMap[c.code] = c.id);

    const prefixes = [
      { prefix: '+57', country_code: 'COL' },
      { prefix: '+1', country_code: 'USA' },
      { prefix: '+52', country_code: 'MEX' },
      { prefix: '+54', country_code: 'ARG' },
      { prefix: '+56', country_code: 'CHL' },
      { prefix: '+51', country_code: 'PER' },
      { prefix: '+55', country_code: 'BRA' },
      { prefix: '+34', country_code: 'ESP' }
    ];

    await queryInterface.bulkInsert(
      { tableName: 'phone_prefixes', schema: SCHEMA },
      prefixes.map(p => ({
        id: uuidv4(),
        prefix: p.prefix,
        country_id: countryMap[p.country_code],
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })),
      {}
    );

    console.log('✅ Prefijos telefónicos creados exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      { tableName: 'phone_prefixes', schema: SCHEMA },
      {
        prefix: ['+57', '+1', '+52', '+54', '+56', '+51', '+55', '+34']
      },
      {}
    );
  }
};