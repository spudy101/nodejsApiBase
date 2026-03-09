'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'reset_credentials', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'users', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Usuario asociado al token de reseteo',
      },
      token: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
        comment: 'Token único para resetear credenciales (URL segura)',
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email del usuario al momento de solicitar el reseteo',
      },
      type: {
        type: Sequelize.ENUM('mfa', 'password'),
        allowNull: false,
        comment: 'Tipo de reseteo: mfa o password',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      used_at: {
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['user_id'], { name: 'idx_reset_credentials_user_id' });
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['token'], { name: 'idx_reset_credentials_token' });
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['email'], { name: 'idx_reset_credentials_email' });
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['type'], { name: 'idx_reset_credentials_type' });
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['expires_at'], { name: 'idx_reset_credentials_expires_at' });
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['used'], { name: 'idx_reset_credentials_used' });
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['token', 'used', 'expires_at'], { name: 'idx_reset_credentials_token_validation' });
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['user_id', 'type', 'used'], { name: 'idx_reset_credentials_user_type_used' });
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['deleted_at'], { name: 'idx_reset_credentials_deleted_at' });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${SCHEMA}"."enum_reset_credentials_type";`);
    await queryInterface.dropTable({ tableName: 'reset_credentials', schema: SCHEMA });
  },
};