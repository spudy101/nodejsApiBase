'use strict';

const SCHEMA = 'notifications';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable({ tableName: 'reset_credentials', schema: SCHEMA }, {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      person_id: {
        type: Sequelize.UUID,
        allowNull: false,
        comment: 'Reference to persons.id in kyc schema (no FK constraint)'
      },
      token: {
        type: Sequelize.STRING(500),
        allowNull: false,
        unique: true,
        comment: 'Token único para resetear credenciales (URL segura)',
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Email del usuario al momento de solicitar el reseteo',
      },
      type: {
        type: Sequelize.ENUM('mfa', 'password'),
        allowNull: false,
        comment: 'Tipo de reseteo: mfa (recuperación MFA) o password (cambio contraseña)',
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: 'Fecha de expiración del token',
      },
      used: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: 'Indica si el token ya fue utilizado',
      },
      used_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha en la que se utilizó el token',
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft delete timestamp',
      },
    });

    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['person_id']);
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['token']);
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['email']);
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['type']);
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['expires_at']);
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['used']);
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['token', 'used', 'expires_at']);
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['person_id', 'type', 'used']);
    await queryInterface.addIndex({ tableName: 'reset_credentials', schema: SCHEMA }, ['deleted_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "${SCHEMA}"."enum_reset_credentials_type";`);
    await queryInterface.dropTable({ tableName: 'reset_credentials', schema: SCHEMA });
  },
};