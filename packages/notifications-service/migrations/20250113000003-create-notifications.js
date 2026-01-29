'use strict';

const SCHEMA = 'notifications';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'notifications', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      person_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to persons.id in kyc schema (no FK constraint)'
      },
      notification_type_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: { tableName: 'notification_types', schema: SCHEMA },
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      title: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      body: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      related_entity_type: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      related_entity_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      read_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      push_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      push_sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      push_error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      push_retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      push_next_retry_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      email_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      email_sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      email_error: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      email_retry_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      email_next_retry_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      scheduled_for: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Para quiet_hours - cuándo debe enviarse'
      },
      priority: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        comment: '1-10, para ordenar cola de envíos'
      },
      processing_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'pending', 
        comment: 'pending, processing, completed, failed'
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

    await queryInterface.addIndex({ tableName: 'notifications', schema: SCHEMA }, ['person_id']);
    await queryInterface.addIndex({ tableName: 'notifications', schema: SCHEMA }, ['notification_type_id']);
    await queryInterface.addIndex({ tableName: 'notifications', schema: SCHEMA }, ['person_id', 'is_read', 'created_at']);
    await queryInterface.addIndex({ tableName: 'notifications', schema: SCHEMA }, ['person_id', 'created_at']);
    await queryInterface.addIndex({ tableName: 'notifications', schema: SCHEMA }, ['related_entity_type', 'related_entity_id']);
    await queryInterface.addIndex({ tableName: 'notifications', schema: SCHEMA }, ['push_next_retry_at']);
    await queryInterface.addIndex({ tableName: 'notifications', schema: SCHEMA }, ['email_next_retry_at']);
    await queryInterface.addIndex({ tableName: 'notifications', schema: SCHEMA }, ['processing_status']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'notifications', schema: SCHEMA });
  }
};