'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const UserPushToken = sequelize.define(
    'UserPushToken',
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
      schema: database.schema_notification,
      timestamps: true,
    }
  );

  // Sin asociaciones — user_id es referencia lógica cross-schema
  UserPushToken.associate = (_models) => {};

  return UserPushToken;
};