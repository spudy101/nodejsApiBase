'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const UserChangeLog = sequelize.define(
    'UserChangeLog',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      changed_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      changed_by_role: {
        type: DataTypes.ENUM('admin', 'user', 'system'),
        allowNull: false,
      },
      change_type: {
        type: DataTypes.ENUM('email', 'password', 'mfa_status', 'account_status', 'role', 'national_id'),
        allowNull: false,
      },
      previous_value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      new_value: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      change_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'user_change_logs',
      schema: database.schema_kyc,
      timestamps: true,
      updatedAt: false,  // tabla de log — solo created_at
    }
  );

  UserChangeLog.associate = (models) => {
    UserChangeLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
    UserChangeLog.belongsTo(models.User, {
      foreignKey: 'changed_by_user_id',
      as: 'changedBy',
    });
  };

  return UserChangeLog;
};