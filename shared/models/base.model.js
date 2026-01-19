'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  return {
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  };
};
