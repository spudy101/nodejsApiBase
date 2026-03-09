'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'cities', schema: SCHEMA }, {
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
      department_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'departments', schema: SCHEMA },
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

    await queryInterface.addIndex({ tableName: 'cities', schema: SCHEMA }, ['department_id']);
    await queryInterface.addIndex({ tableName: 'cities', schema: SCHEMA }, ['name']);
    await queryInterface.addIndex({ tableName: 'cities', schema: SCHEMA }, ['is_active']);
    await queryInterface.addIndex({ tableName: 'cities', schema: SCHEMA }, ['department_id', 'name']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'cities', schema: SCHEMA });
  },
};