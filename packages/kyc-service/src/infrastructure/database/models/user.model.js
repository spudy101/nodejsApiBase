'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Bcrypt hash of password, nullable if using only OAuth',
      },

      cognito_sub: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Cognito sub (user ID unico)',
      },

      cognito_username: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Cognito username (username unico)',
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
      schema: 'kyc',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  User.associate = (models) => {
    User.belongsTo(models.Person, {
      foreignKey: 'person_id',
      as: 'person',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    User.belongsTo(models.Role, {
      foreignKey: 'role_id',
      as: 'role',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    User.belongsTo(models.Avatar, {
      foreignKey: 'avatar_id',
      as: 'avatar',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return User;
};