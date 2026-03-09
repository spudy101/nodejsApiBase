'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const UserNotificationPreference = sequelize.define(
    'UserNotificationPreference',
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
      schema: database.schema_notification,
      timestamps: true,
    }
  );

  UserNotificationPreference.associate = (models) => {
    UserNotificationPreference.belongsTo(models.NotificationType, {
      foreignKey: 'notification_type_code',
      targetKey: 'code',
      as: 'notificationType',
    });
  };

  return UserNotificationPreference;
};