'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const UserLoginAttempt = sequelize.define(
    'UserLoginAttempt',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Null si el usuario no fue encontrado',
      },
      username_attempt: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      national_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      device_fingerprint: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      success: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      failure_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      blocked_until: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      session_cache_key: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      attempted_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'user_login_attempts',
      schema: database.schema_kyc,
      timestamps: true,
    }
  );

  UserLoginAttempt.associate = (models) => {
    UserLoginAttempt.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return UserLoginAttempt;
};