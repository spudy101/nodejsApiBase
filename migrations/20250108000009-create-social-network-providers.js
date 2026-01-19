// migrations/20250108000009-create-social-network-providers.js
'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'social_network_providers', schema: SCHEMA }, {
      social_network_provider_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Instagram, TikTok, Twitter, Facebook, LinkedIn, etc.'
      },
      icon_url: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      base_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Base URL for profile (e.g., https://instagram.com/)'
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

    await queryInterface.addIndex({ tableName: 'social_network_providers', schema: SCHEMA }, ['is_active']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'social_network_providers', schema: SCHEMA });
  }
};