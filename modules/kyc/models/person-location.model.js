'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const PersonLocation = sequelize.define(
    'PersonLocation',
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
      country_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      city_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      postal_code: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING(40),
        allowNull: true,
      },
    },
    {
      tableName: 'person_locations',
      schema: database.schema_kyc,
      timestamps: true,
    }
  );

  PersonLocation.associate = (models) => {
    PersonLocation.belongsTo(models.Person, {
      foreignKey: 'person_id',
      as: 'person',
    });
    PersonLocation.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'country',
    });
    PersonLocation.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department',
    });
    PersonLocation.belongsTo(models.City, {
      foreignKey: 'city_id',
      as: 'city',
    });
  };

  return PersonLocation;
};