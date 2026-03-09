'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const ResetCredential = sequelize.define(
    'ResetCredential',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      token: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('mfa', 'password'),
        allowNull: false,
      },
      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'reset_credentials',
      schema: database.schema_kyc,
      timestamps: true,
      paranoid: true,
      deletedAt: 'deleted_at',
    }
  );

  ResetCredential.associate = (models) => {
    ResetCredential.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return ResetCredential;
};