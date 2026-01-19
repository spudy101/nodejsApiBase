// migrations/20250108000014-create-users.js
'use strict';
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'users', schema: SCHEMA }, {
      user_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Bcrypt hash of password, nullable if using only OAuth'
      },
      cognito_sub: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Cognito sub (user ID unico)'
      },
      cognito_username: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Cognito username (username unico)'
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
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'roles', schema: SCHEMA },
          key: 'role_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      avatar_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'avatars', schema: SCHEMA },
          key: 'avatar_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      totp_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['username']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['cognito_sub']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['person_id']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['role_id']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['is_active']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['deletedAt']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'users', schema: SCHEMA });
  }
};