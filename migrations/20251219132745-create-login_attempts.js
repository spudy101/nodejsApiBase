'use strict';
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'login_attempts', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      blockedUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      ipAddress: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Indice para búsquedas rápidas por email
    await queryInterface.addIndex({ tableName: 'login_attempts', schema: SCHEMA }, ['email']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'login_attempts', schema: SCHEMA });
  }
};
