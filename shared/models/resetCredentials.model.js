'use strict';

const { DataTypes } = require('sequelize');
const { database } = require('../constants');

module.exports = (sequelize) => {
  const ResetCredentials = sequelize.define(
    'ResetCredentials',
    {
      reset_credentials_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Usuario asociado al token de reseteo',
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
        validate: {
          isEmail: {
            msg: 'Email debe ser válido',
          },
        },
        comment: 'Email del usuario al momento de solicitar el reseteo',
      },

      type: {
        type: DataTypes.ENUM('mfa', 'password'),
        allowNull: false,
        validate: {
          isIn: {
            args: [['mfa', 'password']],
            msg: 'Tipo debe ser "mfa" o "password"',
          },
        },
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
      schema: database.schema,
      timestamps: true,
      paranoid: false
    }
  );

  ResetCredentials.associate = (models) => {
    ResetCredentials.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return ResetCredentials;
};