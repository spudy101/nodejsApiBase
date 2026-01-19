'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const NotificationType = sequelize.define(
    'NotificationType',
    {
      notification_type_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },

      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      supports_push: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      supports_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      priority: {
        type: DataTypes.STRING(20),
        defaultValue: 'normal',
      },

      title_template: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      body_template: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      email_subject_template: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      email_body_template: {
        type: DataTypes.TEXT,
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'notification_types',
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  NotificationType.associate = (models) => {
    NotificationType.hasMany(models.UserNotificationPreference, {
      foreignKey: 'notification_type_code',
      sourceKey: 'code',
      as: 'user_preferences',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    NotificationType.hasMany(models.Notification, {
      foreignKey: 'notification_type_id',
      as: 'notifications',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    NotificationType.hasMany(models.GlobalNotification, {
      foreignKey: 'notification_type_id',
      as: 'global_notifications',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return NotificationType;
};