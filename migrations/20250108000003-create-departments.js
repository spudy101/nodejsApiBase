'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'departments', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      country_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'countries', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex({ tableName: 'departments', schema: SCHEMA }, ['country_id']);
    await queryInterface.addIndex({ tableName: 'departments', schema: SCHEMA }, ['name']);
    await queryInterface.addIndex({ tableName: 'departments', schema: SCHEMA }, ['is_active']);
    await queryInterface.addIndex({ tableName: 'departments', schema: SCHEMA }, ['country_id', 'name']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'departments', schema: SCHEMA });
  },
};