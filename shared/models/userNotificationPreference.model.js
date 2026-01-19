'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserNotificationPreference = sequelize.define(
    'UserNotificationPreference',
    {
      user_notification_preference_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      notification_type_code: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },

      allow_push: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      allow_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      quiet_hours_start: {
        type: DataTypes.TIME,
        allowNull: true,
      },

      quiet_hours_end: {
        type: DataTypes.TIME,
        allowNull: true,
      },
    },
    {
      tableName: 'user_notification_preferences',
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  UserNotificationPreference.associate = (models) => {
    UserNotificationPreference.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    UserNotificationPreference.belongsTo(models.NotificationType, {
      foreignKey: 'notification_type_code',
      targetKey: 'code',
      as: 'notification_type',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return UserNotificationPreference;
};