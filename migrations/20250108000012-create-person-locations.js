// migrations/20250108000012-create-person-locations.js
'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'person_locations', schema: SCHEMA }, {
      person_location_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      person_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: { tableName: 'persons', schema: SCHEMA },
          key: 'person_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      department_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'departments', schema: SCHEMA },
          key: 'department_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      city_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'cities', schema: SCHEMA },
          key: 'city_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      address: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      postal_code: {
        type: Sequelize.STRING(40),
        allowNull: true,
      },
      type: {
        type: Sequelize.STRING(40),
        allowNull: true,
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

    await queryInterface.addIndex({ tableName: 'person_locations', schema: SCHEMA }, ['country_id']);
    await queryInterface.addIndex({ tableName: 'person_locations', schema: SCHEMA }, ['department_id']);
    await queryInterface.addIndex({ tableName: 'person_locations', schema: SCHEMA }, ['city_id']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'person_locations', schema: SCHEMA });
  }
};