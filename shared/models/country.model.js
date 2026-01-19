'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../constants');

module.exports = (sequelize) => {
  const Country = sequelize.define(
    'Country',
    {


      country_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },

      code: {
        type: DataTypes.STRING(3),
        allowNull: false,
        unique: true,
        comment: 'ISO 3166-1 alpha-3 code',
      },

      icon_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'countries',
      schema: database.schema,
      timestamps: true,
    }
  );

  Country.associate = (models) => {
    Country.hasMany(models.Department, {
      foreignKey: 'country_id',
      as: 'departments',
    });
  };

  return Country;
};
