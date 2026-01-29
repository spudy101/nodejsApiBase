'use strict';

const { DataTypes } = require('sequelize');

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
      schema: 'kyc',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  Person.associate = (models) => {
    Person.belongsTo(models.Gender, {
      foreignKey: 'gender_id',
      as: 'gender',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

    Person.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'country',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });

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

    Person.hasMany(models.LoginAttempt, {
      foreignKey: 'person_id',
      as: 'login_attempts',
    });

    Person.hasMany(models.PersonChangeLog, {
      foreignKey: 'person_id',
      as: 'change_logs',
    });

    Person.hasMany(models.IdentityValidation, {
      foreignKey: 'person_id',
      as: 'identity_validations',
    });
  };

  return Person;
};