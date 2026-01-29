'use strict';

const { BaseRepository } = require('@abundbank/shared');
const { UserPushToken } = require('../index');
const { Op } = require('sequelize');

class UserPushTokenRepository extends BaseRepository {
  constructor() {
    super(UserPushToken);
  }

  /**
   * Obtiene todos los tokens activos de una persona
   * @param {string} personId - ID de la persona (antes era userId)
   * @returns {Promise<Array>}
   */
  async findActiveByPerson(personId) {
    return await this.findAll({
      person_id: personId,
      is_active: true
    });
  }

  /**
   * Obtiene todos los tokens activos del sistema
   * @returns {Promise<Array>}
   */
  async findAllActive() {
    return await this.findAll(
      { is_active: true },
      { order: [['last_used_at', 'DESC']] }
    );
  }

  /**
   * Busca token por el token string
   * @param {string} token
   * @returns {Promise<Object|null>}
   */
  async findByToken(token) {
    return await this.findOne({ token });
  }

  /**
   * Busca token por device_id
   * @param {string} deviceId
   * @returns {Promise<Object|null>}
   */
  async findByDeviceId(deviceId) {
    return await this.findOne({ device_id: deviceId });
  }

  /**
   * Crea o actualiza un token (upsert por device_id)
   * @param {string} personId - ID de la persona
   * @param {string} token
   * @param {string} platform - 'ios' o 'android'
   * @param {string} deviceId
   * @returns {Promise<Object>}
   */
  async upsertToken(personId, token, platform, deviceId = null) {
    let existing = null;

    if (deviceId) {
      existing = await this.findByDeviceId(deviceId);
    }

    if (!existing) {
      existing = await this.findByToken(token);
    }

    if (existing) {
      return await existing.update({
        person_id: personId,
        token,
        platform,
        device_id: deviceId,
        is_active: true,
        last_used_at: new Date()
      });
    }

    return await this.create({
      person_id: personId,
      token,
      platform,
      device_id: deviceId,
      is_active: true,
      last_used_at: new Date()
    });
  }

  /**
   * Desactiva un token
   * @param {string} tokenId
   * @returns {Promise<Object>}
   */
  async deactivateToken(tokenId) {
    return await this.update(tokenId, { is_active: false });
  }

  /**
   * Desactiva todos los tokens de una persona
   * @param {string} personId
   * @returns {Promise<number>}
   */
  async deactivateAllByPerson(personId) {
    return await this.bulkUpdate(
      { is_active: false },
      { person_id: personId }
    );
  }

  /**
   * Desactiva tokens por device_id
   * @param {string} deviceId
   * @returns {Promise<number>}
   */
  async deactivateByDeviceId(deviceId) {
    return await this.bulkUpdate(
      { is_active: false },
      { device_id: deviceId }
    );
  }

  /**
   * Actualiza last_used_at de un token
   * @param {string} tokenId
   * @returns {Promise<Object>}
   */
  async updateLastUsed(tokenId) {
    return await this.update(tokenId, {
      last_used_at: new Date()
    });
  }

  /**
   * Elimina tokens inactivos antiguos (limpieza)
   * @param {number} daysOld
   * @returns {Promise<number>}
   */
  async deleteOldInactive(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.bulkDelete({
      is_active: false,
      updated_at: { [Op.lt]: cutoffDate }
    });
  }

  /**
   * Cuenta tokens activos por plataforma
   * @returns {Promise<Array>}
   */
  async countByPlatform() {
    const { sequelize } = this.model;
    
    const result = await this.model.findAll({
      where: { is_active: true },
      attributes: [
        'platform',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['platform'],
      raw: true
    });

    return result;
  }

  /**
   * Obtiene tokens activos de múltiples personas
   * @param {Array<string>} personIds
   * @returns {Promise<Array>}
   */
  async findActiveByPersons(personIds) {
    return await this.findAll({
      person_id: { [Op.in]: personIds },
      is_active: true
    });
  }

  /**
   * Busca tokens de una persona por plataforma
   * @param {string} personId
   * @param {string} platform - 'ios' o 'android'
   * @returns {Promise<Array>}
   */
  async findByPersonAndPlatform(personId, platform) {
    return await this.findAll({
      person_id: personId,
      platform,
      is_active: true
    });
  }
}

module.exports = new UserPushTokenRepository();
