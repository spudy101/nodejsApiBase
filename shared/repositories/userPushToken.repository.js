'use strict';

const BaseRepository = require('./base.repository');
const { UserPushToken } = require('../models');
const { Op } = require('sequelize');

class UserPushTokenRepository extends BaseRepository {
  constructor() {
    super(UserPushToken);
  }

  /**
   * Obtiene todos los tokens activos de un usuario
   */
  async findActiveByUser(userId) {
    return await this.findAll({
      user_id: userId,
      is_active: true
    });
  }

  /**
   * Obtiene todos los tokens activos del sistema
   */
  async findAllActive() {
    return await this.findAll(
      { is_active: true },
      { order: [['last_used_at', 'DESC']] }
    );
  }

  /**
   * Busca token por el token string
   */
  async findByToken(token) {
    return await this.findOne({ token });
  }

  /**
   * Busca token por device_id
   */
  async findByDeviceId(deviceId) {
    return await this.findOne({ device_id: deviceId });
  }

  /**
   * Crea o actualiza un token (upsert por device_id)
   */
  async upsertToken(userId, token, platform, deviceId = null) {
    let existing = null;

    if (deviceId) {
      existing = await this.findByDeviceId(deviceId);
    }

    if (!existing) {
      existing = await this.findByToken(token);
    }

    if (existing) {
      return await existing.update({
        user_id: userId,
        token,
        platform,
        device_id: deviceId,
        is_active: true,
        last_used_at: new Date()
      });
    }

    return await this.create({
      user_id: userId,
      token,
      platform,
      device_id: deviceId,
      is_active: true,
      last_used_at: new Date()
    });
  }

  /**
   * Desactiva un token
   */
  async deactivateToken(tokenId) {
    return await this.update(tokenId, { is_active: false });
  }

  /**
   * Desactiva todos los tokens de un usuario
   */
  async deactivateAllByUser(userId) {
    return await this.bulkUpdate(
      { is_active: false },
      { user_id: userId }
    );
  }

  /**
   * Desactiva tokens por device_id
   */
  async deactivateByDeviceId(deviceId) {
    return await this.bulkUpdate(
      { is_active: false },
      { device_id: deviceId }
    );
  }

  /**
   * Actualiza last_used_at de un token
   */
  async updateLastUsed(tokenId) {
    return await this.update(tokenId, {
      last_used_at: new Date()
    });
  }

  /**
   * Elimina tokens inactivos antiguos (limpieza)
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
   */
  async countByPlatform() {
    const { sequelize } = this.model;
    
    const result = await this.model.findAll({
      where: { is_active: true },
      attributes: [
        'platform',
        [sequelize.fn('COUNT', sequelize.col('user_push_token_id')), 'count']
      ],
      group: ['platform'],
      raw: true
    });

    return result;
  }

  /**
   * Obtiene tokens activos de múltiples usuarios
   */
  async findActiveByUsers(userIds) {
    return await this.findAll({
      user_id: { [Op.in]: userIds },
      is_active: true
    });
  }
}

module.exports = new UserPushTokenRepository();