'use strict';

const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
  const Role = sequelize.define(
    'Role',
    {


      role_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'roles',
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  Role.associate = (models) => {
     // Role.hasMany(models.User, { foreignKey: 'role_id', as: 'users' });
  };

  return Role;
};
