// seeders/20250108000008-avatars.js
'use strict';
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Obtener temáticas
    const themes = await queryInterface.sequelize.query(
      `SELECT avatar_theme_id, name FROM "${SCHEMA}"."avatar_themes"`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (themes.length === 0) {
      console.log('⚠️  Temáticas de avatares no encontradas, ejecuta primero el seeder de temáticas');
      return;
    }

    const themeMap = {};
    themes.forEach(t => themeMap[t.name] = t.avatar_theme_id);

    const existingAvatars = await queryInterface.sequelize.query(
      `SELECT COUNT(*) as count FROM "${SCHEMA}"."avatars"`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingAvatars[0].count > 0) {
      console.log('⚠️  Los avatares ya existen, saltando seed...');
      return;
    }

    const avatars = [
      // Animales
      { name: 'León', theme: 'Animales', image_url: '/avatars/animals/leon.png' },
      { name: 'Águila', theme: 'Animales', image_url: '/avatars/animals/aguila.png' },
      { name: 'Delfín', theme: 'Animales', image_url: '/avatars/animals/delfin.png' },
      { name: 'Lobo', theme: 'Animales', image_url: '/avatars/animals/lobo.png' },
      
      // Abstracto
      { name: 'Círculos', theme: 'Abstracto', image_url: '/avatars/abstract/circulos.png' },
      { name: 'Ondas', theme: 'Abstracto', image_url: '/avatars/abstract/ondas.png' },
      { name: 'Geometría', theme: 'Abstracto', image_url: '/avatars/abstract/geometria.png' },
      
      // Superhéroes
      { name: 'Capitán', theme: 'Superhéroes', image_url: '/avatars/heroes/capitan.png' },
      { name: 'Guardián', theme: 'Superhéroes', image_url: '/avatars/heroes/guardian.png' },
      { name: 'Rayo', theme: 'Superhéroes', image_url: '/avatars/heroes/rayo.png' },
      
      // Naturaleza
      { name: 'Montaña', theme: 'Naturaleza', image_url: '/avatars/nature/montana.png' },
      { name: 'Océano', theme: 'Naturaleza', image_url: '/avatars/nature/oceano.png' },
      { name: 'Bosque', theme: 'Naturaleza', image_url: '/avatars/nature/bosque.png' },
      
      // Profesiones
      { name: 'Desarrollador', theme: 'Profesiones', image_url: '/avatars/jobs/dev.png' },
      { name: 'Diseñador', theme: 'Profesiones', image_url: '/avatars/jobs/designer.png' },
      { name: 'Científico', theme: 'Profesiones', image_url: '/avatars/jobs/scientist.png' }
    ];

    await queryInterface.bulkInsert(
      { tableName: 'avatars', schema: SCHEMA },
      avatars.map(avatar => ({
        avatar_id: uuidv4(),
        name: avatar.name,
        avatar_theme_id: themeMap[avatar.theme],
        image_url: avatar.image_url,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      })),
      {}
    );

    console.log('✅ Avatares creados exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete(
      { tableName: 'avatars', schema: SCHEMA },
      {},
      {}
    );
  }
};