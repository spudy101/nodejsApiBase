'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'users', schema: SCHEMA }, {
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
      role_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'roles', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      avatar_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'avatars', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Bcrypt hash of password, nullable if using only OAuth',
      },
      cognito_sub: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Cognito user unique ID',
      },
      cognito_username: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Cognito unique username',
      },
      totp_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['username']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['cognito_sub']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['person_id']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['role_id']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['is_active']);
    await queryInterface.addIndex({ tableName: 'users', schema: SCHEMA }, ['deleted_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'users', schema: SCHEMA });
  },
};