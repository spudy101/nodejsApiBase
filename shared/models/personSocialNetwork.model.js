'use strict';

const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
  const PersonSocialNetwork = sequelize.define(
    'PersonSocialNetwork',
    {


      person_social_network_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      person_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      social_network_provider_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      username_handle: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Username or handle (e.g., @usuario or usuario)',
      },

      profile_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Full profile URL',
      },

      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the social profile has been verified as belonging to this person',
      },
    },
    {
      tableName: 'person_social_networks',
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  PersonSocialNetwork.associate = (models) => {
    PersonSocialNetwork.belongsTo(models.Person, {
      foreignKey: 'person_id',
      as: 'person',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    PersonSocialNetwork.belongsTo(models.SocialNetworkProvider, {
      foreignKey: 'social_network_provider_id',
      as: 'provider',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  };

  return PersonSocialNetwork;
};
