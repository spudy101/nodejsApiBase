'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const Person = sequelize.define(
    'Person',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      middle_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      second_last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      national_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
        unique: true,
        comment: 'RUT, DNI, SSN, etc.',
      },
      birth_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      gender_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      country_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'persons',
      schema: database.schema_kyc,
      timestamps: true,
      paranoid: true,        // habilita deleted_at (soft delete)
      deletedAt: 'deleted_at',
    }
  );

  Person.associate = (models) => {
    Person.belongsTo(models.Gender, {
      foreignKey: 'gender_id',
      as: 'gender',
    });
    Person.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'nationality',
    });
    // 1:1 — person es el eje central
    Person.hasOne(models.PersonContact, {
      foreignKey: 'person_id',
      as: 'contact',
    });
    Person.hasOne(models.PersonLocation, {
      foreignKey: 'person_id',
      as: 'location',
    });
    Person.hasOne(models.User, {
      foreignKey: 'person_id',
      as: 'user',
    });
  };

  return Person;
};