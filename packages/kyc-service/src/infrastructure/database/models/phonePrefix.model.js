'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PhonePrefix = sequelize.define(
    'PhonePrefix',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      prefix: {
        type: DataTypes.STRING(10),
        allowNull: false,
        comment: 'Phone prefix with + (e.g., +56, +1)',
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
      tableName: 'phone_prefixes',
      schema: 'kyc',
      timestamps: true,
      underscored: true,
    }
  );

  PhonePrefix.associate = (models) => {
    PhonePrefix.belongsTo(models.Country, {
      foreignKey: 'country_id',
      as: 'country',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  };

  return PhonePrefix;
};