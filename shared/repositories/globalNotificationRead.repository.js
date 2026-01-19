'use strict';

const BaseRepository = require('./base.repository');
const { GlobalNotificationRead } = require('../models');

class GlobalNotificationReadRepository extends BaseRepository {
  constructor() {
    super(GlobalNotificationRead);
  }

  /**
   * Marca una notificación global como leída para un usuario
   * @param {string} globalNotificationId 
   * @param {string} userId 
   * @returns {Promise<GlobalNotificationRead>}
   */
  async markAsRead(globalNotificationId, userId) {
    const [record, created] = await this.model.findOrCreate({
      where: {
        global_notification_id: globalNotificationId,
        user_id: userId
      },
      defaults: {
        global_notification_id: globalNotificationId,
        user_id: userId,
        read_at: new Date()
      }
    });

    return record;
  }

  /**
   * Marca múltiples notificaciones globales como leídas para un usuario
   * @param {Array<string>} globalNotificationIds 
   * @param {string} userId 
   * @returns {Promise<Array>}
   */
  async bulkMarkAsRead(globalNotificationIds, userId) {
    if (!globalNotificationIds || globalNotificationIds.length === 0) {
      return [];
    }

    const records = globalNotificationIds.map(globalNotificationId => ({
      global_notification_id: globalNotificationId,
      user_id: userId,
      read_at: new Date()
    }));

    // bulkCreate con ignoreDuplicates para evitar errores si ya existe
    return await this.bulkCreate(records, {
      ignoreDuplicates: true
    });
  }

  /**
   * Verifica si un usuario ha leído una notificación global
   * @param {string} globalNotificationId 
   * @param {string} userId 
   * @returns {Promise<boolean>}
   */
  async hasUserRead(globalNotificationId, userId) {
    const count = await this.count({
      global_notification_id: globalNotificationId,
      user_id: userId
    });

    return count > 0;
  }

  /**
   * Obtiene todas las notificaciones globales leídas por un usuario
   * @param {string} userId 
   * @returns {Promise<Array<string>>} Array de global_notification_ids
   */
  async getReadIdsByUser(userId) {
    const records = await this.findAll(
      { user_id: userId },
      { attributes: ['global_notification_id'], raw: true }
    );

    return records.map(r => r.global_notification_id);
  }

  /**
   * Cuenta cuántos usuarios han leído una notificación global
   * @param {string} globalNotificationId 
   * @returns {Promise<number>}
   */
  async countReaders(globalNotificationId) {
    return await this.count({ global_notification_id: globalNotificationId });
  }

  /**
   * Elimina registros de lectura de notificaciones globales antiguas (limpieza)
   * @param {number} daysOld - Días de antigüedad
   * @returns {Promise<number>} Cantidad eliminada
   */
  async deleteOldReads(daysOld = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    return await this.bulkDelete({
      read_at: { [Op.lt]: cutoffDate }
    });
  }
}

module.exports = new GlobalNotificationReadRepository();