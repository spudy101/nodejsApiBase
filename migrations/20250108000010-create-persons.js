// migrations/20250108000010-create-persons.js
'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'persons', schema: SCHEMA }, {
      person_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      national_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
        comment: 'RUT, DNI, SSN, etc.'
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      gender_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'genders', schema: SCHEMA },
          key: 'gender_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      country_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'countries', schema: SCHEMA },
          key: 'country_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex({ tableName: 'persons', schema: SCHEMA }, ['national_id']);
    await queryInterface.addIndex({ tableName: 'persons', schema: SCHEMA }, ['gender_id']);
    await queryInterface.addIndex({ tableName: 'persons', schema: SCHEMA }, ['country_id']);
    await queryInterface.addIndex({ tableName: 'persons', schema: SCHEMA }, ['deletedAt']);
    // Índice compuesto para búsquedas por nombre completo
    await queryInterface.addIndex({ tableName: 'persons', schema: SCHEMA }, ['first_name', 'last_name']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'persons', schema: SCHEMA });
  }
};