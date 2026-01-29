'use strict';

const { BaseRepository } = require('@abundbank/shared');
const { UserNotificationPreference } = require('../index');
const { Op } = require('sequelize');

class UserNotificationPreferenceRepository extends BaseRepository {
  constructor() {
    super(UserNotificationPreference);
  }

  /**
   * INCLUDES PREDEFINIDOS
   */
  static get INCLUDES() {
    return {
      basic: [
        { association: 'notificationType' }
      ],
    };
  }

  /**
   * Busca preferencia de la persona para un tipo específico de notificación
   * Primero busca preferencia específica, si no existe busca global
   * @param {string} personId - ID de la persona (antes era userId)
   * @param {string} notificationTypeCode
   * @returns {Promise<Object|null>}
   */
  async findByPersonAndType(personId, notificationTypeCode) {
    // Intentar obtener preferencia específica
    const specific = await this.findOne({
      person_id: personId,
      notification_type_code: notificationTypeCode
    });

    if (specific) {
      return specific;
    }

    // Si no existe específica, buscar global (notification_type_code = null)
    const global = await this.findOne({
      person_id: personId,
      notification_type_code: null
    });

    return global;
  }

  /**
   * Obtiene la preferencia global de la persona
   * @param {string} personId
   * @returns {Promise<Object|null>}
   */
  async findGlobalByPerson(personId) {
    return await this.findOne({
      person_id: personId,
      notification_type_code: null
    });
  }

  /**
   * Obtiene todas las preferencias específicas de una persona
   * @param {string} personId
   * @returns {Promise<Array>}
   */
  async findAllByPerson(personId) {
    return await this.findAll(
      { person_id: personId },
      {
        order: [['notification_type_code', 'ASC']],
        include: UserNotificationPreferenceRepository.INCLUDES.basic
      }
    );
  }

  /**
   * Crea o actualiza preferencia global de la persona
   * @param {string} personId
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async upsertGlobalPreference(personId, data) {
    const existing = await this.findGlobalByPerson(personId);

    if (existing) {
      return await existing.update(data);
    }

    return await this.create({
      person_id: personId,
      notification_type_code: null,
      ...data
    });
  }

  /**
   * Crea o actualiza preferencia específica de un tipo
   * @param {string} personId
   * @param {string} notificationTypeCode
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async upsertTypePreference(personId, notificationTypeCode, data) {
    const existing = await this.findOne({
      person_id: personId,
      notification_type_code: notificationTypeCode
    });

    if (existing) {
      return await existing.update(data);
    }

    return await this.create({
      person_id: personId,
      notification_type_code: notificationTypeCode,
      ...data
    });
  }

  /**
   * Elimina preferencia específica (vuelve a usar global)
   * @param {string} personId
   * @param {string} notificationTypeCode
   * @returns {Promise<number>}
   */
  async deleteTypePreference(personId, notificationTypeCode) {
    return await this.bulkDelete({
      person_id: personId,
      notification_type_code: notificationTypeCode
    });
  }

  /**
   * Verifica si persona permite push para un tipo
   * @param {string} personId
   * @param {string} notificationTypeCode
   * @returns {Promise<boolean>}
   */
  async personAllowsPush(personId, notificationTypeCode) {
    const preference = await this.findByPersonAndType(personId, notificationTypeCode);
    
    // Si no tiene preferencias, por defecto es true
    return preference?.allow_push ?? true;
  }

  /**
   * Verifica si persona permite email para un tipo
   * @param {string} personId
   * @param {string} notificationTypeCode
   * @returns {Promise<boolean>}
   */
  async personAllowsEmail(personId, notificationTypeCode) {
    const preference = await this.findByPersonAndType(personId, notificationTypeCode);
    
    // Si no tiene preferencias, por defecto es true
    return preference?.allow_email ?? true;
  }

  /**
   * Obtiene personas que permiten push para un tipo específico
   * @param {string} notificationTypeCode
   * @param {Array<string>} personIds - Opcional, filtrar por IDs
   * @returns {Promise<Array>}
   */
  async findPersonsAllowingPush(notificationTypeCode, personIds = null) {
    const where = {
      [Op.or]: [
        { notification_type_code: notificationTypeCode, allow_push: true },
        { notification_type_code: null, allow_push: true }
      ]
    };

    if (personIds) {
      where.person_id = { [Op.in]: personIds };
    }

    return await this.findAll(where);
  }

  /**
   * Obtiene personas que permiten email para un tipo específico
   * @param {string} notificationTypeCode
   * @param {Array<string>} personIds - Opcional, filtrar por IDs
   * @returns {Promise<Array>}
   */
  async findPersonsAllowingEmail(notificationTypeCode, personIds = null) {
    const where = {
      [Op.or]: [
        { notification_type_code: notificationTypeCode, allow_email: true },
        { notification_type_code: null, allow_email: true }
      ]
    };

    if (personIds) {
      where.person_id = { [Op.in]: personIds };
    }

    return await this.findAll(where);
  }
}

module.exports = new UserNotificationPreferenceRepository();
