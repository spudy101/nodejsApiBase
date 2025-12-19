// seeders/XXXXX-demo-products.js
'use strict';
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Verificar si ya existen productos demo
    const existingProducts = await queryInterface.sequelize.query(
      `SELECT name FROM "${SCHEMA}"."products" WHERE name LIKE :pattern`,
      {
        replacements: { pattern: '%Laptop HP Pavilion%' },
        type: Sequelize.QueryTypes.SELECT
      }
    );

    if (existingProducts.length > 0) {
      console.log('⚠️  Los productos de prueba ya existen, saltando seed...');
      return;
    }

    // Obtener admin
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM "${SCHEMA}"."users" WHERE role = 'admin' LIMIT 1;`
    );

    if (users.length === 0) {
      console.log('❌ No hay usuarios admin, ejecuta primero el seed de usuarios');
      return;
    }

    const adminId = users[0].id;

    await queryInterface.bulkInsert({ tableName: 'products', schema: SCHEMA }, [
      {
        id: uuidv4(),
        name: 'Laptop HP Pavilion',
        description: 'Laptop HP Pavilion 15.6" Intel Core i5',
        price: 799.99,
        stock: 15,
        category: 'Electronics',
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Mouse Logitech MX Master 3',
        description: 'Mouse inalámbrico ergonómico',
        price: 99.99,
        stock: 50,
        category: 'Accessories',
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Teclado Mecánico RGB',
        description: 'Teclado mecánico con iluminación RGB',
        price: 129.99,
        stock: 30,
        category: 'Accessories',
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Monitor LG 27"',
        description: 'Monitor LG UltraGear 27" 144Hz',
        price: 349.99,
        stock: 0,
        category: 'Electronics',
        isActive: true,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: uuidv4(),
        name: 'Producto Descontinuado',
        description: 'Este producto ya no está disponible',
        price: 49.99,
        stock: 100,
        category: 'Other',
        isActive: false,
        createdBy: adminId,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});

    console.log('✅ Productos de prueba creados exitosamente');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete({ tableName: 'products', schema: SCHEMA }, {
      name: [
        'Laptop HP Pavilion',
        'Mouse Logitech MX Master 3',
        'Teclado Mecánico RGB',
        'Monitor LG 27"',
        'Producto Descontinuado'
      ]
    }, {});
  }
};