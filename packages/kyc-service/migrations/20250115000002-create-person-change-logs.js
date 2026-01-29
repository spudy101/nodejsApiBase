// migrations/20250115000002-create-person-change-logs.js
'use strict';

const SCHEMA = 'kyc';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      { tableName: 'person_change_logs', schema: SCHEMA },
      {
        id: {
          type: Sequelize.UUID,
          primaryKey: true,
          defaultValue: Sequelize.UUIDV4,
        },
        person_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: { tableName: 'persons', schema: SCHEMA },
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'CASCADE',
          comment: 'Persona afectada por el cambio',
        },
        changed_by_person_id: {
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: { tableName: 'persons', schema: SCHEMA },
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
          comment: 'Persona que realizó el cambio (null si fue el sistema)',
        },
        changed_by_role: {
          type: Sequelize.ENUM('admin', 'user', 'system'),
          allowNull: false,
          comment: 'Rol del que hizo el cambio',
        },
        change_type: {
          type: Sequelize.ENUM(
            'email',
            'password',
            'mfa_status',
            'account_status',
            'role',
            'national_id'
          ),
          allowNull: false,
          comment: 'Tipo de cambio realizado',
        },
        previous_value: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Valor anterior (null para password por seguridad)',
        },
        new_value: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Valor nuevo (null para password por seguridad)',
        },
        change_reason: {
          type: Sequelize.STRING(255),
          allowNull: true,
          comment: 'Razón del cambio (opcional)',
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true,
          comment: 'IP desde donde se hizo el cambio',
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'Navegador/dispositivo usado',
        },
        created_at: {
          type: Sequelize.DATE,
          defaultValue: Sequelize.NOW,
          allowNull: false,
        },
      }
    );

    await queryInterface.addIndex(
      { tableName: 'person_change_logs', schema: SCHEMA },
      ['person_id'],
      { name: 'idx_person_change_logs_person_id' }
    );

    await queryInterface.addIndex(
      { tableName: 'person_change_logs', schema: SCHEMA },
      ['changed_by_person_id'],
      { name: 'idx_person_change_logs_changed_by' }
    );

    await queryInterface.addIndex(
      { tableName: 'person_change_logs', schema: SCHEMA },
      ['change_type'],
      { name: 'idx_person_change_logs_change_type' }
    );

    await queryInterface.addIndex(
      { tableName: 'person_change_logs', schema: SCHEMA },
      ['created_at'],
      { name: 'idx_person_change_logs_created_at' }
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable({ tableName: 'person_change_logs', schema: SCHEMA });
  },
};