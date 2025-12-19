'use strict';
require('dotenv').config();

const SCHEMA = process.env.DB_SCHEMA;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createSchema(SCHEMA);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropSchema(SCHEMA);
  }
};
