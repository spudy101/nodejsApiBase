'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserPushToken = sequelize.define(
    'UserPushToken',
    {
      user_push_token_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      token: {
        type: DataTypes.TEXT,
        allowNull: false,
      },

      platform: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },

      device_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },

      last_used_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'user_push_tokens',
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  UserPushToken.associate = (models) => {
    UserPushToken.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return UserPushToken;
};