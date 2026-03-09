'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_notification;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'global_notifications', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      notification_type_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'notification_types', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      send_push: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      send_email: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      send_in_app: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      push_processing_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'pending',
      },
      email_processing_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'pending',
      },
      push_sent_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      email_sent_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      starts_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      ends_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      target_user_role: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      target_conditions: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      // Referencia lógica — sin FK cross-schema (kyc.users)
      created_by: {
        type: Sequelize.UUID,
        allowNull: true,
        comment: 'Referencia lógica a kyc.users.id — sin FK cross-schema',
      },
      batch_size: {
        type: Sequelize.INTEGER,
        defaultValue: 100,
        comment: 'Usuarios por lote para AWS SES/SNS',
      },
      processing_started_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      processing_completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      total_target_users: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Cantidad total de usuarios elegibles',
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

    await queryInterface.addIndex({ tableName: 'global_notifications', schema: SCHEMA }, ['notification_type_id']);
    await queryInterface.addIndex({ tableName: 'global_notifications', schema: SCHEMA }, ['is_active', 'starts_at', 'ends_at']);
    await queryInterface.addIndex({ tableName: 'global_notifications', schema: SCHEMA }, ['created_by']);
    await queryInterface.addIndex({ tableName: 'global_notifications', schema: SCHEMA }, ['push_processing_status']);
    await queryInterface.addIndex({ tableName: 'global_notifications', schema: SCHEMA }, ['email_processing_status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'global_notifications', schema: SCHEMA });
  },
};