'use strict';

const BaseRepository       = require('../../../shared/repositories/base.repository');
const AppError             = require('../../../shared/utils/app-error.util');
const { UserTrustedDevice } = require('../../../shared/models');

class TrustedDeviceRepository extends BaseRepository {
  constructor() {
    super(UserTrustedDevice);
  }

  /**
   * Busca un dispositivo por fingerprint_hash para un usuario
   * Usado para saber si el dispositivo ya es conocido
   */
  async findByFingerprint(userId, fingerprintHash) {
    return await this.findOne({
      user_id:          userId,
      fingerprint_hash: fingerprintHash,
    });
  }

  /**
   * Busca un dispositivo por id validando que pertenezca al usuario
   * Usado antes de renombrar o eliminar — seguridad
   */
  async findByIdAndUser(deviceId, userId) {
    return await this.findOne({
      id:      deviceId,
      user_id: userId,
    });
  }

  /**
   * Lista todos los dispositivos de un usuario ordenados por último acceso
   */
  async findAllByUser(userId) {
    return await this.findAll(
      { user_id: userId },
      { order: [['last_seen_at', 'DESC']] }
    );
  }

  /**
   * Cuenta dispositivos de un usuario
   * Usado para respetar el límite de 5
   */
  async countByUser(userId) {
    return await this.count({ user_id: userId });
  }

  /**
   * Crea un nuevo dispositivo de confianza
   */
  async create(data, options = {}) {
    return await super.create({
      user_id:          data.user_id,
      fingerprint_hash: data.fingerprint_hash,
      device_name:      data.device_name,
      trusted_at:       data.trusted_at   || new Date(),
      last_seen_at:     data.last_seen_at || new Date(),
    }, options);
  }

  /**
   * Actualiza last_seen_at — llamar en cada login exitoso desde dispositivo conocido
   */
  async updateLastSeen(userId, fingerprintHash) {
    return await this.model.update(
      { last_seen_at: new Date() },
      { where: { user_id: userId, fingerprint_hash: fingerprintHash } }
    );
  }

  /**
   * Renombra un dispositivo
   */
  async rename(deviceId, deviceName) {
    const device = await this.findById(deviceId);
    if (!device) throw AppError.notFound('Dispositivo no encontrado');
    return await device.update({ device_name: deviceName });
  }

  /**
   * Elimina el dispositivo más antiguo (por last_seen_at) de un usuario
   * Llamar cuando se alcanza el límite de 5 dispositivos
   */
  async deleteOldest(userId) {
    const oldest = await this.findOne(
      { user_id: userId },
      { order: [['last_seen_at', 'ASC']] }
    );
    if (oldest) await oldest.destroy();
  }

  /**
   * Elimina un dispositivo por id
   */
  async delete(deviceId) {
    return await super.delete(deviceId);
  }
}

module.exports = new TrustedDeviceRepository();