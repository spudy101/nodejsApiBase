'use strict';
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

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
          key: 'global_notification_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        primaryKey: true,
        references: {
          model: { tableName: 'users', schema: SCHEMA },
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      read_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    await queryInterface.addIndex({ tableName: 'global_notification_reads', schema: SCHEMA }, ['global_notification_id']);
    await queryInterface.addIndex({ tableName: 'global_notification_reads', schema: SCHEMA }, ['user_id']);
    await queryInterface.addIndex({ tableName: 'global_notification_reads', schema: SCHEMA }, ['read_at']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'global_notification_reads', schema: SCHEMA });
  }
};