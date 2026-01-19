// seeders/20250108000006-roles.js
'use strict';
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingRoles = await queryInterface.sequelize.query(
      `SELECT name FROM "${SCHEMA}"."roles" WHERE name IN (:names)`,
      {
        replacements: { 
          names: ['admin', 'user', 'moderator'] 
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingRoles.length > 0) {
      console.log('⚠️  Los roles ya existen, saltando seed...');
      return;
    }

    const roles = [
      { name: 'admin', description: 'Administrador del sistema con acceso total' },
      { name: 'user', description: 'Usuario regular del sistema' },
      { name: 'moderator', description: 'Moderador con permisos especiales' }
    ];

    await queryInterface.bulkInsert(
      { tableName: 'roles', schema: SCHEMA },
      roles.map(role => ({
        role_id: uuidv4(),
        name: role.name,
        description: role.description,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })),
      {}
    );

    console.log('✅ Roles creados exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      { tableName: 'roles', schema: SCHEMA },
      {
        name: ['admin', 'user', 'moderator']
      },
      {}
    );
  }
};