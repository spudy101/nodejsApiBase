'use strict';

const SCHEMA = 'notifications';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'global_notification_reads', schema: SCHEMA }, {
      global_notification_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: { tableName: 'global_notifications', schema: SCHEMA },
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      person_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        comment: 'Reference to persons.id in kyc schema (no FK constraint)'
      },
      read_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex({ tableName: 'global_notification_reads', schema: SCHEMA }, ['global_notification_id']);
    await queryInterface.addIndex({ tableName: 'global_notification_reads', schema: SCHEMA }, ['person_id']);
    await queryInterface.addIndex({ tableName: 'global_notification_reads', schema: SCHEMA }, ['read_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'global_notification_reads', schema: SCHEMA });
  }
};