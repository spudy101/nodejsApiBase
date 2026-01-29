'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LoginAttempt = sequelize.define(
    'LoginAttempt',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      person_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Null if person not found',
      },

      username_attempt: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Username de cognito',
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
      tableName: 'login_attempts',
      schema: 'kyc',
      timestamps: true,
      underscored: true,
    }
  );

  LoginAttempt.associate = (models) => {
    LoginAttempt.belongsTo(models.Person, {
      foreignKey: 'person_id',
      as: 'person',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return LoginAttempt;
};