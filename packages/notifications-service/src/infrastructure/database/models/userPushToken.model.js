'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserPushToken = sequelize.define(
    'UserPushToken',
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
      schema: 'notifications',
      timestamps: true,
      underscored: true,
    }
  );

  UserPushToken.associate = (models) => {
    // No associations - person_id references kyc schema
  };

  return UserPushToken;
};