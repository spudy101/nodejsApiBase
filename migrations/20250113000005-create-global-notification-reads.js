'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_notification;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'global_notification_reads', schema: SCHEMA }, {
      global_notification_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: { tableName: 'global_notifications', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      // Referencia lógica — sin FK cross-schema (kyc.users)
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        comment: 'Referencia lógica a kyc.users.id — sin FK cross-schema',
      },
      read_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex({ tableName: 'global_notification_reads', schema: SCHEMA }, ['global_notification_id']);
    await queryInterface.addIndex({ tableName: 'global_notification_reads', schema: SCHEMA }, ['user_id']);
    await queryInterface.addIndex({ tableName: 'global_notification_reads', schema: SCHEMA }, ['read_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'global_notification_reads', schema: SCHEMA });
  },
};