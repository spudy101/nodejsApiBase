'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const Avatar = sequelize.define(
    'Avatar',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      avatar_theme_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'avatars',
      schema: database.schema_kyc,
      timestamps: true,
    }
  );

  Avatar.associate = (models) => {
    Avatar.belongsTo(models.AvatarTheme, {
      foreignKey: 'avatar_theme_id',
      as: 'theme',
    });
    Avatar.hasMany(models.User, {
      foreignKey: 'avatar_id',
      as: 'users',
    });
  };

  return Avatar;
};