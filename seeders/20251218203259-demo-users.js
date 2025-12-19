'use strict';
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si ya existen usuarios
    const existingUsers = await queryInterface.sequelize.query(
      `SELECT email FROM "${SCHEMA}"."users" WHERE email IN (:emails)`,
      {
        replacements: { 
          emails: ['admin@example.com', 'user@example.com', 'inactive@example.com'] 
        },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    // Si ya existen usuarios, no insertar nada
    if (existingUsers.length > 0) {
      console.log('⚠️  Los usuarios de prueba ya existen, saltando seed...');
      return;
    }

    // Si no existen, insertar
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await queryInterface.bulkInsert(
      { tableName: 'users', schema: SCHEMA }, [
      {
        id: uuidv4(),
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'user@example.com',
        password: hashedPassword,
        name: 'Regular User',
        role: 'user',
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        email: 'inactive@example.com',
        password: hashedPassword,
        name: 'Inactive User',
        role: 'user',
        isActive: false,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    console.log('✅ Usuarios de prueba creados exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete({ tableName: 'users', schema: SCHEMA }, {
      email: ['admin@example.com', 'user@example.com', 'inactive@example.com']
    }, {});
  }
};