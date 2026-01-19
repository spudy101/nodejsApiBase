// seeders/20250108000009-social-network-providers.js
'use strict';
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const existingProviders = await queryInterface.sequelize.query(
      `SELECT name FROM "${SCHEMA}"."social_network_providers" WHERE name IN (:names)`,
      {
        replacements: { 
          names: ['Instagram', 'TikTok', 'Twitter', 'Facebook', 'LinkedIn', 'YouTube'] 
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingProviders.length > 0) {
      console.log('⚠️  Los proveedores de redes sociales ya existen, saltando seed...');
      return;
    }

    const providers = [
      { 
        name: 'Instagram', 
        icon_url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/instagram.svg',
        base_url: 'https://instagram.com/'
      },
      { 
        name: 'TikTok', 
        icon_url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/tiktok.svg',
        base_url: 'https://tiktok.com/@'
      },
      { 
        name: 'Twitter', 
        icon_url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/twitter.svg',
        base_url: 'https://twitter.com/'
      },
      { 
        name: 'Facebook', 
        icon_url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/facebook.svg',
        base_url: 'https://facebook.com/'
      },
      { 
        name: 'LinkedIn', 
        icon_url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/linkedin.svg',
        base_url: 'https://linkedin.com/in/'
      },
      { 
        name: 'YouTube', 
        icon_url: 'https://cdn.jsdelivr.net/npm/simple-icons@v9/icons/youtube.svg',
        base_url: 'https://youtube.com/@'
      }
    ];

    await queryInterface.bulkInsert(
      { tableName: 'social_network_providers', schema: SCHEMA },
      providers.map(provider => ({
        social_network_provider_id: uuidv4(),
        name: provider.name,
        icon_url: provider.icon_url,
        base_url: provider.base_url,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })),
      {}
    );

    console.log('✅ Proveedores de redes sociales creados exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      { tableName: 'social_network_providers', schema: SCHEMA },
      {
        name: ['Instagram', 'TikTok', 'Twitter', 'Facebook', 'LinkedIn', 'YouTube']
      },
      {}
    );
  }
};