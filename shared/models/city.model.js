'use strict';

const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
  const City = sequelize.define(
    'City',
    {


      city_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },

      department_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'cities',
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  City.associate = (models) => {
    City.belongsTo(models.Department, {
      foreignKey: 'department_id',
      as: 'department',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  };

  return City;
};
