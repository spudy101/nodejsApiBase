'use strict';

const BaseRepository = require('../../../shared/repositories/base.repository');
const { ResetCredentials } = require('../../../shared/models');
const { Op } = require('sequelize');

class ResetCredentialsRepository extends BaseRepository {
  constructor() {
    super(ResetCredentials);
  }

  /**
   * Busca un token válido (no usado y no expirado)
   * @param {string} token - Token a validar
   * @returns {Promise<ResetCredentials|null>}
   */
  async findValidToken(token, options = {}) {
    return await this.findOne(
      {
        token,
        used: false,
        expires_at: {
          [Op.gt]: new Date()
        }
      },
      options
    );
  }

  /**
   * Busca un token por su valor (sin validar expiración ni uso)
   * @param {string} token - Token a buscar
   * @returns {Promise<ResetCredentials|null>}
   */
  async findByToken(token) {
    return await this.findOne({ token });
  }

  /**
   * Marca un token como usado
   * @param {string} resetCredentialsId - ID del token
   * @param {object} options - Opciones de Sequelize (transaction, etc)
   * @returns {Promise<ResetCredentials>}
   */
  async markAsUsed(resetCredentialsId, options = {}) {
    return await this.update(
      resetCredentialsId,
      {
        used: true,
        used_at: new Date(),
      },
      options
    );
  }

  /**
   * Invalida todos los tokens activos de un usuario
   * @param {string} userId - ID del usuario
   * @param {object} options - Opciones de Sequelize (transaction, etc)
   * @returns {Promise<number>} - Cantidad de tokens invalidados
   */
  async invalidateUserTokens(userId, options = {}) {
    const [affectedCount] = await this.bulkUpdate(
      {
        used: true,
        used_at: new Date(),
      },
      {
        user_id: userId,
        used: false, // Solo tokens que aún no se han usado
      },
      options
    );

    return affectedCount;
  }

  /**
   * Crea un nuevo token de reset
   * @param {object} data - Datos del token { user_id, token, email, type, expires_at }
   * @param {object} options - Opciones de Sequelize (transaction, etc)
   * @returns {Promise<ResetCredentials>}
   */
  async createResetToken(data, options = {}) {
    return await this.create(
      {
        user_id: data.user_id,
        token: data.token,
        email: data.email,
        type: data.type,
        expires_at: data.expires_at,
        used: false,
      },
      options
    );
  }

  /**
   * Limpia tokens expirados (útil para tareas de mantenimiento)
   * @param {object} options - Opciones de Sequelize (transaction, etc)
   * @returns {Promise<number>} - Cantidad de tokens eliminados
   */
  async cleanExpiredTokens(options = {}) {
    return await this.bulkDelete(
      {
        expires_at: {
          [Op.lt]: new Date(), // Menor a fecha actual
        },
        used: true, // Solo limpiar tokens ya usados
      },
      options
    );
  }

  /**
   * Cuenta tokens activos de un usuario por tipo
   * @param {string} userId - ID del usuario
   * @param {string} type - Tipo de token ('mfa' | 'password')
   * @returns {Promise<number>}
   */
  async countActiveTokensByType(userId, type) {
    return await this.count({
      user_id: userId,
      type,
      used: false,
      expires_at: {
        [Op.gt]: new Date(),
      },
    });
  }

  // Override para usar reset_credentials_id
  async findById(resetCredentialsId, options = {}) {
    return await this.model.findByPk(resetCredentialsId, options);
  }

  async delete(resetCredentialsId) {
    return await this.model.destroy({ where: { reset_credentials_id: resetCredentialsId } });
  }
}

module.exports = new ResetCredentialsRepository();