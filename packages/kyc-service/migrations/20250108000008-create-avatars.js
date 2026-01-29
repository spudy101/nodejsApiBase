// migrations/20250108000008-create-avatars.js
'use strict';

const SCHEMA = 'kyc';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'avatars', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      avatar_theme_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'avatar_themes', schema: SCHEMA },
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      image_url: {
        type: Sequelize.STRING(255),
        allowNull: true
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

    await queryInterface.addIndex({ tableName: 'avatars', schema: SCHEMA }, ['avatar_theme_id']);
    await queryInterface.addIndex({ tableName: 'avatars', schema: SCHEMA }, ['is_active']);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'avatars', schema: SCHEMA });
  }
};