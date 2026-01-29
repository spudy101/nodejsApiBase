'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PersonContact = sequelize.define(
    'PersonContact',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },

      person_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },

      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },

      email_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      phone_primary: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      phone_primary_prefix_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      phone_primary_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },

      phone_secondary: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },

      phone_secondary_prefix_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },

      phone_secondary_verified_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'person_contacts',
      schema: 'kyc',
      timestamps: true,
      underscored: true,
    }
  );

  PersonContact.associate = (models) => {
    PersonContact.belongsTo(models.Person, {
      foreignKey: 'person_id',
      as: 'person',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });

    PersonContact.belongsTo(models.PhonePrefix, {
      foreignKey: 'phone_primary_prefix_id',
      as: 'phone_primary_prefix',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });

    PersonContact.belongsTo(models.PhonePrefix, {
      foreignKey: 'phone_secondary_prefix_id',
      as: 'phone_secondary_prefix',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
  };

  return PersonContact;
};