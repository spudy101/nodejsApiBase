'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const Department = sequelize.define(
    'Department',
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
      country_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'departments',
      schema: database.schema_kyc,
      timestamps: true,
    }
  );

  Department.associate = (models) => {
    Department.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'country',
    });
    Department.hasMany(models.City, {
      foreignKey: 'department_id',
      as: 'cities',
    });
    Department.hasMany(models.PersonLocation, {
      foreignKey: 'department_id',
      as: 'personLocations',
    });
  };

  return Department;
};