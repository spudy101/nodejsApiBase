'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'user_notification_preferences', schema: SCHEMA }, {
      user_notification_preference_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'users', schema: SCHEMA },
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      notification_type_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
        references: {
          model: { tableName: 'notification_types', schema: SCHEMA },
          key: 'code'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      allow_push: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      allow_email: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      quiet_hours_start: {
        type: Sequelize.TIME,
        allowNull: true
      },
      quiet_hours_end: {
        type: Sequelize.TIME,
        allowNull: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex({ tableName: 'user_notification_preferences', schema: SCHEMA }, ['user_id']);
    await queryInterface.addIndex({ tableName: 'user_notification_preferences', schema: SCHEMA }, ['notification_type_code']);
    await queryInterface.addIndex({ tableName: 'user_notification_preferences', schema: SCHEMA }, ['user_id', 'notification_type_code'], { unique: true });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'user_notification_preferences', schema: SCHEMA });
  }
};