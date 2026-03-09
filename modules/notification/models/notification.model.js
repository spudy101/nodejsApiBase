'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      // Referencia lógica a kyc.users.id — sin FK cross-schema
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      notification_type_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      related_entity_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      related_entity_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      push_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      push_sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      push_error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      push_retry_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      push_next_retry_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      email_sent: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      email_sent_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      email_error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      email_retry_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      email_next_retry_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      scheduled_for: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      priority: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
      },
      processing_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
      },
    },
    {
      tableName: 'notifications',
      schema: database.schema_notification,
      timestamps: true,
    }
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.NotificationType, {
      foreignKey: 'notification_type_id',
      as: 'notificationType',
    });
  };

  return Notification;
};