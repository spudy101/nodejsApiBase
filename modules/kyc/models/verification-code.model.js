'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const VerificationCode = sequelize.define(
    'VerificationCode',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      type: {
        type: DataTypes.ENUM('email', 'phone'),
        allowNull: false,
      },
      contact_value: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Email address or phone number',
      },
      code: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
      attempts: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'verification_codes',
      schema: database.schema_kyc,
      timestamps: true,
    }
  );

  // Sin asociaciones — se resuelve por contact_value, no por FK
  VerificationCode.associate = (_models) => {};

  return VerificationCode;
};