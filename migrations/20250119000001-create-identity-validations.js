// migrations/20250119000001-create-identity-validations.js
'use strict';
const { database } = require('../shared/constants');

const SCHEMA = database.schema;

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'identity_validations', schema: SCHEMA }, {
      validation_id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      person_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: { tableName: 'persons', schema: SCHEMA },
          key: 'person_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'signed', 'cancelled', 'failed', 'expired'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Estado de la validación de identidad'
      },
      zapsign_document_id: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'ID del documento en ZapSign'
      },
      zapsign_signer_token: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Token del firmante en ZapSign'
      },
      initiated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha en que se completó o falló la validación'
      },
      attempts: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Número de intentos de validación'
      },
      last_attempt_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha del último intento'
      },
      document_url: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'URL del documento en ZapSign'
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mensaje de error si la validación falla'
      },
      webhook_data: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Datos raw del webhook de ZapSign'
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

    // Índices
    await queryInterface.addIndex(
      { tableName: 'identity_validations', schema: SCHEMA }, 
      ['person_id', 'status'],
      { name: 'idx_identity_validations_person_status' }
    );
    
    await queryInterface.addIndex(
      { tableName: 'identity_validations', schema: SCHEMA }, 
      ['zapsign_document_id'],
      { name: 'idx_identity_validations_zapsign_doc' }
    );
    
    await queryInterface.addIndex(
      { tableName: 'identity_validations', schema: SCHEMA }, 
      ['status'],
      { name: 'idx_identity_validations_status' }
    );
    
    await queryInterface.addIndex(
      { tableName: 'identity_validations', schema: SCHEMA }, 
      ['initiated_at'],
      { name: 'idx_identity_validations_initiated_at' }
    );
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'identity_validations', schema: SCHEMA });
  }
};