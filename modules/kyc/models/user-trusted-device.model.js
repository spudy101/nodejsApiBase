'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../../../shared/constants');

module.exports = (sequelize) => {
  const UserTrustedDevice = sequelize.define(
    'UserTrustedDevice',
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
      fingerprint_hash: {
        type: DataTypes.STRING(64),
        allowNull: false,
        comment: 'SHA-256 del User-Agent normalizado (sin IP)',
      },
      device_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Generado automáticamente desde User-Agent, editable por el usuario',
      },
      trusted_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      last_seen_at: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      tableName: 'user_trusted_devices',
      schema: database.schema_kyc,
      timestamps: true,
    }
  );

  UserTrustedDevice.associate = (models) => {
    UserTrustedDevice.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
    });
  };

  return UserTrustedDevice;
};