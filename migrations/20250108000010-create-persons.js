'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'persons', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      middle_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      second_last_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      national_id: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
        comment: 'RUT, DNI, SSN, etc.',
      },
      birth_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      gender_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'genders', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      country_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'countries', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex({ tableName: 'persons', schema: SCHEMA }, ['national_id']);
    await queryInterface.addIndex({ tableName: 'persons', schema: SCHEMA }, ['gender_id']);
    await queryInterface.addIndex({ tableName: 'persons', schema: SCHEMA }, ['country_id']);
    await queryInterface.addIndex({ tableName: 'persons', schema: SCHEMA }, ['deleted_at']);
    await queryInterface.addIndex({ tableName: 'persons', schema: SCHEMA }, ['first_name', 'last_name']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'persons', schema: SCHEMA });
  },
};