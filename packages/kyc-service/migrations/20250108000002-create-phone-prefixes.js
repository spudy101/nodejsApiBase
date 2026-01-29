// migrations/20250108000002-create-phone-prefixes.js
'use strict';

const SCHEMA = 'kyc';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'phone_prefixes', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      prefix: {
        type: Sequelize.STRING(10),
        allowNull: false,
        comment: 'Phone prefix with + (e.g., +56, +1)'
      },
      country_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'countries', schema: SCHEMA },
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex({ tableName: 'phone_prefixes', schema: SCHEMA }, ['prefix']);
    await queryInterface.addIndex({ tableName: 'phone_prefixes', schema: SCHEMA }, ['country_id']);
    await queryInterface.addIndex({ tableName: 'phone_prefixes', schema: SCHEMA }, ['is_active']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'phone_prefixes', schema: SCHEMA });
  }
};