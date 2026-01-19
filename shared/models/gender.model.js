'use strict';

const { DataTypes } = require('sequelize');


module.exports = (sequelize) => {
  const Gender = sequelize.define(
    'Gender',
    {


      gender_id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },

      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'genders',
      schema: process.env.DB_SCHEMA,
      timestamps: true,
    }
  );

  return Gender;
};
