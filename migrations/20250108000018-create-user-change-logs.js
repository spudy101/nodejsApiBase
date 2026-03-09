'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'user_change_logs', schema: SCHEMA }, {
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
        comment: 'Usuario afectado por el cambio',
      },
      changed_by_user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'users', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Usuario que realizó el cambio (null si fue el sistema)',
      },
      changed_by_role: {
        type: Sequelize.ENUM('admin', 'user', 'system'),
        allowNull: false,
      },
      change_type: {
        type: Sequelize.ENUM('email', 'password', 'mfa_status', 'account_status', 'role', 'national_id'),
        allowNull: false,
      },
      previous_value: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Valor anterior (null para password por seguridad)',
      },
      new_value: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Valor nuevo (null para password por seguridad)',
      },
      change_reason: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex({ tableName: 'user_change_logs', schema: SCHEMA }, ['user_id'], { name: 'idx_user_change_logs_user_id' });
    await queryInterface.addIndex({ tableName: 'user_change_logs', schema: SCHEMA }, ['changed_by_user_id'], { name: 'idx_user_change_logs_changed_by' });
    await queryInterface.addIndex({ tableName: 'user_change_logs', schema: SCHEMA }, ['change_type'], { name: 'idx_user_change_logs_change_type' });
    await queryInterface.addIndex({ tableName: 'user_change_logs', schema: SCHEMA }, ['created_at'], { name: 'idx_user_change_logs_created_at' });
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${SCHEMA}"."enum_user_change_logs_changed_by_role";`);
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${SCHEMA}"."enum_user_change_logs_change_type";`);
    await queryInterface.dropTable({ tableName: 'user_change_logs', schema: SCHEMA });
  },
};