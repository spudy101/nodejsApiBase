'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const AvatarTheme = sequelize.define(
    'AvatarTheme',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'avatar_themes',
      schema: database.schema_kyc,
      timestamps: true,
    }
  );

  AvatarTheme.associate = (models) => {
    AvatarTheme.hasMany(models.Avatar, {
      foreignKey: 'avatar_theme_id',
      as: 'avatars',
    });
  };

  return AvatarTheme;
};