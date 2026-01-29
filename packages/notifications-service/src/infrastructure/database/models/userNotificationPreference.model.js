'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserNotificationPreference = sequelize.define(
    'UserNotificationPreference',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      person_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Reference to persons.id in kyc schema (no FK constraint)',
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
      schema: 'notifications',
      timestamps: true,
      underscored: true,
    }
  );

  UserNotificationPreference.associate = (models) => {
    UserNotificationPreference.belongsTo(models.NotificationType, {
      foreignKey: 'notification_type_code',
      targetKey: 'code',
      as: 'notificationType',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return UserNotificationPreference;
};