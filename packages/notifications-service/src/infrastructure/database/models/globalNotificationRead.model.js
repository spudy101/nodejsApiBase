'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GlobalNotificationRead = sequelize.define(
    'GlobalNotificationRead',
    {
      global_notification_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },

      person_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        comment: 'Reference to persons.id in kyc schema (no FK constraint)',
      },

      read_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'global_notification_reads',
      schema: 'notifications',
      timestamps: false,
      underscored: true,
    }
  );

  GlobalNotificationRead.associate = (models) => {
    GlobalNotificationRead.belongsTo(models.GlobalNotification, {
      foreignKey: 'global_notification_id',
      as: 'globalNotification',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return GlobalNotificationRead;
};