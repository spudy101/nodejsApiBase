'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserChangeLog = sequelize.define(
    'UserChangeLog',
    {
      log_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'Usuario afectado por el cambio',
      },

      changed_by_user_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: 'Usuario que realizó el cambio (null si fue el sistema)',
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

      created_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
      },
    },
    {
      tableName: 'user_change_logs',
      schema: process.env.DB_SCHEMA,
      timestamps: false, // Solo created_at manual
      underscored: true,
      indexes: [
        {
          name: 'idx_user_change_logs_user_id',
          fields: ['user_id'],
        },
        {
          name: 'idx_user_change_logs_change_type',
          fields: ['change_type'],
        },
        {
          name: 'idx_user_change_logs_created_at',
          fields: ['created_at'],
        },
      ],
    }
  );

  UserChangeLog.associate = (models) => {
    UserChangeLog.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    UserChangeLog.belongsTo(models.User, {
      foreignKey: 'changed_by_user_id',
      as: 'changedBy',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return UserChangeLog;
};