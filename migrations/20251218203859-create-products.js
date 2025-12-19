'use strict';
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable({ tableName: 'products', schema: SCHEMA }, {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0
        }
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0
        }
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      createdBy: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices
    await queryInterface.addIndex({ tableName: 'products', schema: SCHEMA }, ['name']);
    await queryInterface.addIndex({ tableName: 'products', schema: SCHEMA }, ['category']);
    await queryInterface.addIndex({ tableName: 'products', schema: SCHEMA }, ['isActive']);
    await queryInterface.addIndex({ tableName: 'products', schema: SCHEMA }, ['createdBy']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable({ tableName: 'products', schema: SCHEMA });
  }
};