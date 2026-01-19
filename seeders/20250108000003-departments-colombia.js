// seeders/20250108000003-departments-colombia.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { database } = require('../shared/constants');

const SCHEMA = database.schema;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Obtener Colombia
    const [colombia] = await queryInterface.sequelize.query(
      `SELECT country_id FROM "${SCHEMA}"."countries" WHERE code = 'COL'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!colombia) {
      console.log('⚠️  País Colombia no encontrado, ejecuta primero el seeder de países');
      return;
    }

    const existingDepartments = await queryInterface.sequelize.query(
      `SELECT name FROM "${SCHEMA}"."departments" WHERE country_id = :countryId`,
      {
        replacements: { countryId: colombia.country_id },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingDepartments.length > 0) {
      console.log('⚠️  Los departamentos de Colombia ya existen, saltando seed...');
      return;
    }

    const departments = [
      'Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bolívar',
      'Boyacá', 'Caldas', 'Caquetá', 'Casanare', 'Cauca',
      'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía',
      'Guaviare', 'Huila', 'La Guajira', 'Magdalena', 'Meta',
      'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
      'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca',
      'Vaupés', 'Vichada', 'Bogotá D.C.'
    ];

    await queryInterface.bulkInsert(
      { tableName: 'departments', schema: SCHEMA },
      departments.map(name => ({
        department_id: uuidv4(),
        name,
        country_id: colombia.country_id,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })),
      {}
    );

    console.log('✅ Departamentos de Colombia creados exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    const [colombia] = await queryInterface.sequelize.query(
      `SELECT id FROM "${SCHEMA}"."countries" WHERE code = 'COL'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (colombia) {
      await queryInterface.bulkDelete(
        { tableName: 'departments', schema: SCHEMA },
        { country_id: colombia.id },
        {}
      );
    }
  }
};