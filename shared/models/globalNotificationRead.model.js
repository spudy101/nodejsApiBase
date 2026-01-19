'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GlobalNotificationRead = sequelize.define(
    'GlobalNotificationRead',
    {
      global_notification_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },

      user_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },

      read_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'global_notification_reads',
      schema: process.env.DB_SCHEMA,
      timestamps: false,
    }
  );

  GlobalNotificationRead.associate = (models) => {
    GlobalNotificationRead.belongsTo(models.GlobalNotification, {
      foreignKey: 'global_notification_id',
      as: 'global_notification',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    GlobalNotificationRead.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return GlobalNotificationRead;
};