// migrations/20250108000003-create-departments.js
'use strict';
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'departments', schema: SCHEMA }, {
      department_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      country_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'countries', schema: SCHEMA },
          key: 'country_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex({ tableName: 'departments', schema: SCHEMA }, ['country_id']);
    await queryInterface.addIndex({ tableName: 'departments', schema: SCHEMA }, ['name']);
    await queryInterface.addIndex({ tableName: 'departments', schema: SCHEMA }, ['is_active']);
    // Índice compuesto para búsquedas por país
    await queryInterface.addIndex({ tableName: 'departments', schema: SCHEMA }, ['country_id', 'name']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'departments', schema: SCHEMA });
  }
};