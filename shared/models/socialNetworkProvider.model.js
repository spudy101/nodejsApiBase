'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../constants');

module.exports = (sequelize) => {
  const SocialNetworkProvider = sequelize.define(
    'SocialNetworkProvider',
    {


      social_network_provider_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Instagram, TikTok, Twitter, Facebook, LinkedIn, etc.',
      },

      icon_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      base_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Base URL for profile (e.g., https://instagram.com/)',
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'social_network_providers',
      schema: database.schema,
      timestamps: true,
    }
  );

  SocialNetworkProvider.associate = (models) => {
    SocialNetworkProvider.hasMany(models.PersonSocialNetwork, {
      foreignKey: 'social_network_provider_id',
      as: 'person_social_networks',
    });
  };

  return SocialNetworkProvider;
};
