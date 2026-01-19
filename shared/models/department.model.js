'use strict';

const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
  const Department = sequelize.define(
    'Department',
    {


      department_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      country_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'departments',
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  Department.associate = (models) => {
    Department.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'country',
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  };

  return Department;
};
