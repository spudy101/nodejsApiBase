// migrations/20250108000015-create-verification-codes.js
'use strict';
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'verification_codes', schema: SCHEMA }, {
      verification_code_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      type: {
        type: Sequelize.ENUM('email', 'phone'),
        allowNull: false
      },
      contact_value: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email address or phone number'
      },
      code: {
        type: Sequelize.STRING(10),
        allowNull: false
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      verified_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex({ tableName: 'verification_codes', schema: SCHEMA }, ['contact_value']);
    await queryInterface.addIndex({ tableName: 'verification_codes', schema: SCHEMA }, ['type']);
    await queryInterface.addIndex({ tableName: 'verification_codes', schema: SCHEMA }, ['expires_at']);
    await queryInterface.addIndex({ tableName: 'verification_codes', schema: SCHEMA }, ['verified_at']);
    // Índice compuesto para búsquedas de códigos activos
    await queryInterface.addIndex({ tableName: 'verification_codes', schema: SCHEMA }, ['contact_value', 'type', 'expires_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${SCHEMA}"."enum_verification_codes_type";`);
    await queryInterface.dropTable({ tableName: 'verification_codes', schema: SCHEMA });
  }
};