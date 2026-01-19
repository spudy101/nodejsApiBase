'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const GlobalNotification = sequelize.define(
    'GlobalNotification',
    {
      global_notification_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
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

      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      send_push: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      send_email: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },

      send_in_app: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      push_processing_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
      },

      email_processing_status: {
        type: DataTypes.STRING(20),
        defaultValue: 'pending',
      },

      push_sent_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      email_sent_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      starts_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },

      ends_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      target_user_role: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },

      target_conditions: {
        type: DataTypes.JSONB,
        allowNull: true,
      },

      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      batch_size: {
        type: DataTypes.INTEGER,
        defaultValue: 100,
        comment: 'Usuarios por lote para AWS SES/SNS'
      },

      processing_started_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Cuándo empezó el procesamiento'
      },

      processing_completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Cuándo terminó el procesamiento'
      },

      total_target_users: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Cantidad total de usuarios elegibles'
      },
    },
    {
      tableName: 'global_notifications',
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  GlobalNotification.associate = (models) => {
    GlobalNotification.belongsTo(models.NotificationType, {
      foreignKey: 'notification_type_id',
      as: 'notification_type',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    GlobalNotification.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    GlobalNotification.belongsToMany(models.User, {
      through: models.GlobalNotificationRead,
      foreignKey: 'global_notification_id',
      otherKey: 'user_id',
      as: 'readers',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return GlobalNotification;
};