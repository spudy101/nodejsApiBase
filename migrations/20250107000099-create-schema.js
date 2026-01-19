'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createSchema(SCHEMA);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropSchema(SCHEMA);
  }
};
