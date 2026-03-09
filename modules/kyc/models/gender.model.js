'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const Gender = sequelize.define(
    'Gender',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'genders',
      schema: database.schema_kyc,
      timestamps: true,
    }
  );

  Gender.associate = (models) => {
    Gender.hasMany(models.Person, {
      foreignKey: 'gender_id',
      as: 'persons',
    });
  };

  return Gender;
};