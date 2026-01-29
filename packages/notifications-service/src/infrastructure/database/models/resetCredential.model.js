'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ResetCredential = sequelize.define(
    'ResetCredential',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      person_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Reference to persons.id in kyc schema (no FK constraint)',
      },

      token: {
        type: DataTypes.STRING(500),
        allowNull: false,
        unique: true,
        comment: 'Token único para resetear credenciales (URL segura)',
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        comment: 'Email del usuario al momento de solicitar el reseteo',
      },

      type: {
        type: DataTypes.ENUM('mfa', 'password'),
        allowNull: false,
        comment: 'Tipo de reseteo: mfa (recuperación MFA) o password (cambio contraseña)',
      },

      expires_at: {
        type: DataTypes.DATE,
        allowNull: false,
        comment: 'Fecha de expiración del token',
      },

      used: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si el token ya fue utilizado',
      },

      used_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha en la que se utilizó el token',
      },
    },
    {
      tableName: 'reset_credentials',
      schema: 'notifications',
      timestamps: true,
      paranoid: true,
      underscored: true,
    }
  );

  ResetCredential.associate = (models) => {
    // No associations - person_id references kyc schema
  };

  return ResetCredential;
};