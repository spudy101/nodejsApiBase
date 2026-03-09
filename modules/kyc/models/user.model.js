'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      person_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      avatar_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Bcrypt hash, nullable si usa solo OAuth',
      },
      cognito_sub: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      cognito_username: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
      },
      totp_enabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'users',
      schema: database.schema_kyc,
      timestamps: true,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Person, {
      foreignKey: 'person_id',
      as: 'person',
    });
    User.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role',
    });
    User.belongsTo(models.Avatar, {
      foreignKey: 'avatar_id',
      as: 'avatar',
    });
    User.hasMany(models.UserLoginAttempt, {
      foreignKey: 'user_id',
      as: 'loginAttempts',
    });
    User.hasMany(models.ResetCredential, {
      foreignKey: 'user_id',
      as: 'resetCredentials',
    });
    User.hasMany(models.UserChangeLog, {
      foreignKey: 'user_id',
      as: 'changeLogs',
    });
    User.hasMany(models.UserChangeLog, {
      foreignKey: 'changed_by_user_id',
      as: 'changesMade',
    });
    User.hasMany(models.UserTrustedDevice, {
      foreignKey: 'user_id',
      as: 'trustedDevices',
    });
  };

  return User;
};