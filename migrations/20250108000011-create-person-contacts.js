'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'person_contacts', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      person_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: { tableName: 'persons', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // EMAIL
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      email_verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // PRIMARY PHONE
      phone_primary: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      phone_primary_prefix_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'phone_prefixes', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      phone_primary_verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      // SECONDARY PHONE
      phone_secondary: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      phone_secondary_prefix_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'phone_prefixes', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      phone_secondary_verified_at: {
        type: Sequelize.DATE,
        allowNull: true,
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

    await queryInterface.addIndex({ tableName: 'person_contacts', schema: SCHEMA }, ['email']);
    await queryInterface.addIndex({ tableName: 'person_contacts', schema: SCHEMA }, ['phone_primary']);
    await queryInterface.addIndex({ tableName: 'person_contacts', schema: SCHEMA }, ['phone_secondary']);
    await queryInterface.addIndex({ tableName: 'person_contacts', schema: SCHEMA }, ['email_verified_at']);
    await queryInterface.addIndex({ tableName: 'person_contacts', schema: SCHEMA }, ['phone_primary_verified_at']);
    await queryInterface.addIndex({ tableName: 'person_contacts', schema: SCHEMA }, ['email', 'email_verified_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'person_contacts', schema: SCHEMA });
  },
};