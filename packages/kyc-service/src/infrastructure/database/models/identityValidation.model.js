'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const IdentityValidation = sequelize.define(
    'IdentityValidation',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      person_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      status: {
        type: DataTypes.ENUM('pending', 'signed', 'cancelled', 'failed', 'expired'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Estado de la validación de identidad',
      },

      zapsign_document_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'ID del documento en ZapSign',
      },

      zapsign_signer_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Token del firmante en ZapSign',
      },

      initiated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },

      completed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha en que se completó o falló la validación',
      },

      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Número de intentos de validación',
      },

      last_attempt_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Fecha del último intento',
      },

      document_url: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'URL del documento en ZapSign',
      },

      error_message: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Mensaje de error si la validación falla',
      },

      webhook_data: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Datos raw del webhook de ZapSign',
      },
    },
    {
      tableName: 'identity_validations',
      schema: 'kyc',
      timestamps: true,
      underscored: true,
    }
  );

  IdentityValidation.associate = (models) => {
    IdentityValidation.belongsTo(models.Person, {
      foreignKey: 'person_id',
      as: 'person',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  return IdentityValidation;
};