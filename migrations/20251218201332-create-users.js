'use strict';
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable({ tableName: 'users', schema: SCHEMA }, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        defaultValue: 'user',
        allowNull: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para mejorar performance
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['email']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['role']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['isActive']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName: 'users', schema: SCHEMA });
  }
};