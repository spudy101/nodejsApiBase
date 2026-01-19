// migrations/20250108000013-create-person-social-networks.js
'use strict';
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'person_social_networks', schema: SCHEMA }, {
      person_social_network_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      person_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'persons', schema: SCHEMA },
          key: 'person_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      social_network_provider_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'social_network_providers', schema: SCHEMA },
          key: 'social_network_provider_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      username_handle: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Username or handle (e.g., @usuario or usuario)'
      },
      profile_url: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Full profile URL'
      },
      is_verified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Whether the social profile has been verified as belonging to this person'
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

    await queryInterface.addIndex({ tableName: 'person_social_networks', schema: SCHEMA }, ['person_id']);
    await queryInterface.addIndex({ tableName: 'person_social_networks', schema: SCHEMA }, ['social_network_provider_id']);
    // Índice compuesto para evitar duplicados (persona + red social)
    await queryInterface.addIndex(
      { tableName: 'person_social_networks', schema: SCHEMA }, 
      ['person_id', 'social_network_provider_id'],
      { unique: true }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'person_social_networks', schema: SCHEMA });
  }
};