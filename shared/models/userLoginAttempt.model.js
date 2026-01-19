'use strict';

const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
  const UserLoginAttempt = sequelize.define(
    'UserLoginAttempt',
    {


      user_login_attempt_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Null if user not found',
      },

      username_attempt: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Username or email attempted',
      },

      national_id: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },

      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IPv4 or IPv6',
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
        comment: 'Invalid credentials, account locked, etc.',
      },

      blocked_until: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'When the account/IP will be unblocked',
      },

      attempted_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },

      session_cache_key: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Redis/cache key for active session tokens',
      },
    },
    {
      tableName: 'user_login_attempts',
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  UserLoginAttempt.associate = (models) => {
    UserLoginAttempt.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return UserLoginAttempt;
};
