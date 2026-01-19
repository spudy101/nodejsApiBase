'use strict';

const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
  const Avatar = sequelize.define(
    'Avatar',
    {


      avatar_id: {
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
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  Avatar.associate = (models) => {
    Avatar.belongsTo(models.AvatarTheme, {
      foreignKey: 'avatar_theme_id',
      as: 'theme',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  };

  return Avatar;
};
