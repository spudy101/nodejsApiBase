'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_notification;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.createSchema(SCHEMA);
  },

  async down(queryInterface) {
    await queryInterface.dropSchema(SCHEMA);
  },
};