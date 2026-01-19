'use strict';

const BaseRepository = require('./base.repository');
const { UserNotificationPreference } = require('../models');
const { Op } = require('sequelize');

class UserNotificationPreferenceRepository extends BaseRepository {
  constructor() {
    super(UserNotificationPreference);
  }

  /**
   * Busca preferencia del usuario para un tipo específico de notificación
   * Primero busca preferencia específica, si no existe busca global
   */
  async findByUserAndType(userId, notificationTypeCode) {
    // Intentar obtener preferencia específica
    const specific = await this.findOne({
      user_id: userId,
      notification_type_code: notificationTypeCode
    });

    if (specific) {
      return specific;
    }

    // Si no existe específica, buscar global (notification_type_code = null)
    const global = await this.findOne({
      user_id: userId,
      notification_type_code: null
    });

    return global;
  }

  /**
   * Obtiene la preferencia global del usuario
   */
  async findGlobalByUser(userId) {
    return await this.findOne({
      user_id: userId,
      notification_type_code: null
    });
  }

  /**
   * Obtiene todas las preferencias específicas de un usuario
   */
  async findAllByUser(userId) {
    return await this.findAll(
      { user_id: userId },
      {
        order: [['notification_type_code', 'ASC']],
        include: [{ association: 'notification_type' }]
      }
    );
  }

  /**
   * Crea o actualiza preferencia global del usuario
   */
  async upsertGlobalPreference(userId, data) {
    const existing = await this.findGlobalByUser(userId);

    if (existing) {
      return await existing.update(data);
    }

    return await this.create({
      user_id: userId,
      notification_type_code: null,
      ...data
    });
  }

  /**
   * Crea o actualiza preferencia específica de un tipo
   */
  async upsertTypePreference(userId, notificationTypeCode, data) {
    const existing = await this.findOne({
      user_id: userId,
      notification_type_code: notificationTypeCode
    });

    if (existing) {
      return await existing.update(data);
    }

    return await this.create({
      user_id: userId,
      notification_type_code: notificationTypeCode,
      ...data
    });
  }

  /**
   * Elimina preferencia específica (vuelve a usar global)
   */
  async deleteTypePreference(userId, notificationTypeCode) {
    return await this.bulkDelete({
      user_id: userId,
      notification_type_code: notificationTypeCode
    });
  }

  /**
   * Verifica si usuario permite push para un tipo
   */
  async userAllowsPush(userId, notificationTypeCode) {
    const preference = await this.findByUserAndType(userId, notificationTypeCode);
    
    // Si no tiene preferencias, por defecto es true
    return preference?.allow_push ?? true;
  }

  /**
   * Verifica si usuario permite email para un tipo
   */
  async userAllowsEmail(userId, notificationTypeCode) {
    const preference = await this.findByUserAndType(userId, notificationTypeCode);
    
    // Si no tiene preferencias, por defecto es true
    return preference?.allow_email ?? true;
  }

  /**
   * Obtiene usuarios que permiten push para un tipo específico
   */
  async findUsersAllowingPush(notificationTypeCode, userIds = null) {
    const where = {
      [Op.or]: [
        { notification_type_code: notificationTypeCode, allow_push: true },
        { notification_type_code: null, allow_push: true }
      ]
    };

    if (userIds) {
      where.user_id = { [Op.in]: userIds };
    }

    return await this.findAll(where);
  }

  /**
   * Obtiene usuarios que permiten email para un tipo específico
   */
  async findUsersAllowingEmail(notificationTypeCode, userIds = null) {
    const where = {
      [Op.or]: [
        { notification_type_code: notificationTypeCode, allow_email: true },
        { notification_type_code: null, allow_email: true }
      ]
    };

    if (userIds) {
      where.user_id = { [Op.in]: userIds };
    }

    return await this.findAll(where);
  }
}

module.exports = new UserNotificationPreferenceRepository();