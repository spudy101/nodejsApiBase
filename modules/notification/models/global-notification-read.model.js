'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const GlobalNotificationRead = sequelize.define(
    'GlobalNotificationRead',
    {
      global_notification_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      // Referencia lógica a kyc.users.id — sin FK cross-schema
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      read_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'global_notification_reads',
      schema: database.schema_notification,
      timestamps: false,  // solo read_at, sin created_at/updated_at
    }
  );

  GlobalNotificationRead.associate = (models) => {
    GlobalNotificationRead.belongsTo(models.GlobalNotification, {
      foreignKey: 'global_notification_id',
      as: 'globalNotification',
    });
  };

  return GlobalNotificationRead;
};