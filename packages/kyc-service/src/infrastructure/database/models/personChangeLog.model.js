'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PersonChangeLog = sequelize.define(
    'PersonChangeLog',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      person_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Persona afectada por el cambio',
      },

      changed_by_person_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Persona que realizó el cambio (null si fue el sistema)',
      },

      changed_by_role: {
        type: DataTypes.ENUM('admin', 'user', 'system'),
        allowNull: false,
        comment: 'Rol del que hizo el cambio',
      },

      change_type: {
        type: DataTypes.ENUM(
          'email',
          'password',
          'mfa_status',
          'account_status',
          'role',
          'national_id'
        ),
        allowNull: false,
        comment: 'Tipo de cambio realizado',
      },

      previous_value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Valor anterior (null para password por seguridad)',
      },

      new_value: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Valor nuevo (null para password por seguridad)',
      },

      change_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Razón del cambio (opcional)',
      },

      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
        comment: 'IP desde donde se hizo el cambio',
      },

      user_agent: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Navegador/dispositivo usado',
      },
    },
    {
      tableName: 'person_change_logs',
      schema: 'kyc',
      timestamps: true,
      updatedAt: false,
      underscored: true,
    }
  );

  PersonChangeLog.associate = (models) => {
    PersonChangeLog.belongsTo(models.Person, {
      foreignKey: 'person_id',
      as: 'person',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    PersonChangeLog.belongsTo(models.Person, {
      foreignKey: 'changed_by_person_id',
      as: 'changed_by_person',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return PersonChangeLog;
};