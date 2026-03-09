// seeders/20250108000006-roles.js
'use strict';
const { v4: uuidv4 } = require('uuid');
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existing = await queryInterface.sequelize.query(
      `SELECT name FROM "${SCHEMA}"."roles" WHERE name IN (:names)`,
      {
        replacements: { names: ['admin', 'super_admin', 'user', 'user_verified'] },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    if (existing.length > 0) {
      console.log('⚠️  Los roles ya existen, saltando seed...');
      return;
    }

    const roles = [
      { name: 'super_admin',    description: 'Administrador con acceso total al sistema' },
      { name: 'admin',          description: 'Administrador del sistema' },
      { name: 'user',           description: 'Usuario regular del sistema' },
      { name: 'user_verified',  description: 'Usuario verificado, puede comentar publicaciones' },
    ];

    await queryInterface.bulkInsert(
      { tableName: 'roles', schema: SCHEMA },
      roles.map(role => ({
        id: uuidv4(),
        name: role.name,
        description: role.description,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      })),
      {}
    );

    console.log('✅ Roles creados exitosamente');
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete(
      { tableName: 'roles', schema: SCHEMA },
      { name: ['admin', 'super_admin', 'user', 'user_verified'] },
      {}
    );
  },
};