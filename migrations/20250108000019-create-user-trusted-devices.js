'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema_kyc;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'user_trusted_devices', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'users', schema: SCHEMA },
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      fingerprint_hash: {
        type: Sequelize.STRING(64),
        allowNull: false,
        comment: 'SHA-256 del User-Agent normalizado (sin IP)',
      },
      device_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Generado automáticamente desde User-Agent, editable por el usuario',
      },
      trusted_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Fecha en que el usuario confirmó este dispositivo como confiable',
      },
      last_seen_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Último acceso detectado desde este dispositivo',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Evita duplicados: un mismo dispositivo no puede registrarse dos veces por usuario
    await queryInterface.addIndex(
      { tableName: 'user_trusted_devices', schema: SCHEMA },
      ['user_id', 'fingerprint_hash'],
      { unique: true, name: 'uq_user_trusted_devices_user_fingerprint' }
    );

    await queryInterface.addIndex({ tableName: 'user_trusted_devices', schema: SCHEMA }, ['user_id']);
    await queryInterface.addIndex({ tableName: 'user_trusted_devices', schema: SCHEMA }, ['fingerprint_hash']);
    await queryInterface.addIndex({ tableName: 'user_trusted_devices', schema: SCHEMA }, ['last_seen_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable({ tableName: 'user_trusted_devices', schema: SCHEMA });
  },
};