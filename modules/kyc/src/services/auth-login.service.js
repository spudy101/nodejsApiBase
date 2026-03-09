'use strict';

const { Op } = require('sequelize');
const userRepository             = require('../../repositories/user.repository');
const userLoginAttemptRepository = require('../../repositories/user-login-attempt.repository');
const trustedDeviceRepository    = require('../../repositories/trusted-device.repository');
const CognitoUtil                = require('../../../../shared/utils/cognito.util');
const DeviceFingerprintUtil      = require('../../../../shared/utils/device-fingerprint.util');
const NotificationUtil           = require('../../../notification/src/services/notification-creation.service');
const AppError                   = require('../../../../shared/utils/app-error.util');
const { logger }                 = require('../../../../shared/utils/logger.util');
const { LOGIN_ATTEMPTS }         = require('../../../../shared/constants');
const {
  LoginResponseDTO,
  MFARequiredResponseDTO,
  RefreshTokenResponseDTO,
  TrustedDeviceListDTO,
  TrustedDeviceUpdateDTO,
} = require('../dtos/auth-login.dto');

class AuthLoginService {

  // ============================================================
  // LOGIN
  // ============================================================

  /**
   * Inicia sesión con credenciales
   * @param {{ nationalId, password }} data
   * @param {{ ip, userAgent, fingerprintHash }} auditContext
   */
  async login(data, auditContext) {
    const { nationalId, password }           = data;
    const { ip, userAgent, fingerprintHash } = auditContext;

    await this._checkAccountBlock(nationalId);

    const user = await this._getUserForLogin(nationalId);

    const isValid = await userRepository.verifyPassword(password, user.password_hash);
    if (!isValid) {
      await this._handleFailedLogin(user, nationalId, { ip, userAgent, fingerprintHash }, 'Contraseña inválida');
    }

    const authResult = await this._authenticateWithCognito(user, nationalId, { ip, userAgent, fingerprintHash, password });

    if (authResult.challengeName) {
      return new MFARequiredResponseDTO({
        username:      authResult.username,
        session:       authResult.session,
        challengeType: authResult.challengeName,
      });
    }

    return this._completeSuccessfulLogin(user, nationalId, fingerprintHash, authResult, auditContext);
  }

  /**
   * Verifica código TOTP y completa el login
   * @param {{ nationalId, totpCode, session }} data
   * @param {{ ip, userAgent, fingerprintHash }} auditContext
   */
  async verifyMFA(data, auditContext) {
    const { nationalId, totpCode, session }  = data;
    const { ip, userAgent, fingerprintHash } = auditContext;

    await this._checkAccountBlock(nationalId);

    const user = await this._getUserForLogin(nationalId);

    // try/catch justificado: necesitamos registrar el intento fallido antes de relanzar
    let tokens;
    try {
      tokens = await CognitoUtil.respondToTOTPChallenge(user.cognito_username, totpCode, session);
    } catch (error) {
      await userLoginAttemptRepository.recordAttempt({
        user_id:            user.id,
        username_attempt:   user.cognito_username,
        national_id:        nationalId,
        ip_address:         ip,
        user_agent:         userAgent,
        device_fingerprint: fingerprintHash,
        success:            false,
        failure_reason:     'Código TOTP incorrecto',
        attempted_at:       new Date(),
      });
      throw error;
    }

    return this._completeSuccessfulLogin(user, nationalId, fingerprintHash, tokens, auditContext);
  }

  /**
   * Refresca el access token
   * @param {string} refreshToken
   * @param {string} nationalId
   */
  async refreshToken(refreshToken, nationalId) {
    const user = await userRepository.findByNationalId(nationalId);
    if (!user) throw AppError.unauthorized('Usuario no encontrado');

    const tokens = await CognitoUtil.refreshAccessToken(refreshToken, user.cognito_username);

    return new RefreshTokenResponseDTO(tokens);
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  /**
   * Cierra sesión del dispositivo actual.
   * No invalida tokens en Cognito — el cliente descarta los tokens localmente.
   * Solo actualizamos last_seen_at del dispositivo de confianza si existe.
   */
  async logout(userId, fingerprintHash) {
    await trustedDeviceRepository.updateLastSeen(userId, fingerprintHash)
      .catch(err => logger.error('Error updating last_seen on logout', { error: err.message }));

    logger.info('Logout completed', { userId, fingerprintHash });
    return null;
  }

  // ============================================================
  // TRUSTED DEVICES
  // ============================================================

  /**
   * Lista dispositivos de confianza del usuario
   * @param {string} userId
   * @param {string} currentFingerprintHash - Para marcar el dispositivo actual
   */
  async getTrustedDevices(userId, currentFingerprintHash) {
    const devices = await trustedDeviceRepository.findAllByUser(userId);
    return new TrustedDeviceListDTO(devices, currentFingerprintHash);
  }

  /**
   * Renombra un dispositivo de confianza
   * @param {string} userId
   * @param {string} deviceId
   * @param {string} deviceName
   */
  async renameDevice(userId, deviceId, deviceName) {
    const device = await trustedDeviceRepository.findByIdAndUser(deviceId, userId);
    if (!device) throw AppError.notFound('Dispositivo no encontrado');

    const updated = await trustedDeviceRepository.rename(deviceId, deviceName);
    return new TrustedDeviceUpdateDTO(updated);
  }

  /**
   * Elimina un dispositivo de confianza.
   * No se puede eliminar el dispositivo desde el que se está operando.
   * @param {string} userId
   * @param {string} deviceId
   * @param {string} currentFingerprintHash
   */
  async removeDevice(userId, deviceId, currentFingerprintHash) {
    const device = await trustedDeviceRepository.findByIdAndUser(deviceId, userId);
    if (!device) throw AppError.notFound('Dispositivo no encontrado');

    if (device.fingerprint_hash === currentFingerprintHash) {
      throw AppError.badRequest('No puedes eliminar el dispositivo actual. Usa el endpoint de logout');
    }

    await trustedDeviceRepository.delete(deviceId);
    logger.info('Trusted device removed', { userId, deviceId });
    return null;
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  /** @private */
  async _checkAccountBlock(nationalId) {
    const blockStatus = await userLoginAttemptRepository.checkIfBlocked(nationalId);
    if (blockStatus?.blocked) {
      throw AppError.forbidden(
        `Cuenta bloqueada temporalmente. Intenta nuevamente en ${blockStatus.remainingMinutes} minutos`
      );
    }
  }

  /** @private */
  async _getUserForLogin(nationalId) {
    const user = await userRepository.findByNationalIdForLogin(nationalId);
    if (!user)           throw AppError.unauthorized('Credenciales inválidas');
    if (!user.is_active) throw AppError.forbidden('Cuenta inactiva o suspendida');
    return user;
  }

  /** @private */
  async _handleFailedLogin(user, nationalId, auditContext, reason) {
    const failedCount   = await userLoginAttemptRepository.countFailedAttempts(nationalId);
    const newCount      = failedCount + 1;
    const MAX           = LOGIN_ATTEMPTS.MAX_ATTEMPTS;
    const BLOCK_MINUTES = LOGIN_ATTEMPTS.BLOCK_DURATION_MINUTES;
    const blockedUntil  = newCount >= MAX
      ? new Date(Date.now() + BLOCK_MINUTES * 60 * 1000)
      : null;

    await userLoginAttemptRepository.recordAttempt({
      user_id:            user.id,
      username_attempt:   user.cognito_username,
      national_id:        nationalId,
      ip_address:         auditContext.ip,
      user_agent:         auditContext.userAgent,
      device_fingerprint: auditContext.fingerprintHash,
      success:            false,
      failure_reason:     reason,
      blocked_until:      blockedUntil,
      attempted_at:       new Date(),
    });

    if (newCount >= MAX) {
      throw AppError.forbidden(`Cuenta bloqueada por ${BLOCK_MINUTES} minutos debido a múltiples intentos fallidos`);
    }

    throw AppError.unauthorized(`Contraseña incorrecta. Te quedan ${MAX - newCount} intentos`);
  }

  /** @private */
  async _authenticateWithCognito(user, nationalId, auditContext) {
    // try/catch justificado: necesitamos registrar el intento fallido antes de relanzar
    try {
      return await CognitoUtil.authenticateUser(user.cognito_username, auditContext.password);
    } catch (error) {
      await userLoginAttemptRepository.recordAttempt({
        user_id:            user.id,
        username_attempt:   user.cognito_username,
        national_id:        nationalId,
        ip_address:         auditContext.ip,
        user_agent:         auditContext.userAgent,
        device_fingerprint: auditContext.fingerprintHash,
        success:            false,
        failure_reason:     'Error en Cognito',
        attempted_at:       new Date(),
      });
      throw AppError.internal('Error al autenticar usuario');
    }
  }

  /**
   * Registra el intento exitoso, maneja dispositivo de confianza y retorna el DTO.
   * El manejo del dispositivo va en setImmediate porque no bloquea la respuesta al cliente.
   * @private
   */
  async _completeSuccessfulLogin(user, nationalId, fingerprintHash, tokens, auditContext) {
    await userLoginAttemptRepository.recordAttempt({
      user_id:            user.id,
      username_attempt:   user.cognito_username,
      national_id:        nationalId,
      ip_address:         auditContext.ip,
      user_agent:         auditContext.userAgent,
      device_fingerprint: fingerprintHash,
      success:            true,
      attempted_at:       new Date(),
    });

    setImmediate(() => {
      this._handleTrustedDevice(user, fingerprintHash, auditContext)
        .catch(err => logger.error('Error handling trusted device on login', { error: err.message }));
    });

    logger.info('Login completed', { userId: user.id, nationalId });

    return new LoginResponseDTO({ user, tokens });
  }

  /**
   * Registra el dispositivo si es nuevo (respetando límite de 5) y notifica al usuario.
   * Si ya existe, solo actualiza last_seen_at.
   *
   * Límite de 5 dispositivos: cuando se supera, se elimina el más antiguo por last_seen_at
   * para dar lugar al nuevo. Esto evita acumulación indefinida de dispositivos abandonados.
   *
   * @private
   */
  async _handleTrustedDevice(user, fingerprintHash, auditContext) {
    const existing = await trustedDeviceRepository.findByFingerprint(user.id, fingerprintHash);

    if (existing) {
      await trustedDeviceRepository.updateLastSeen(user.id, fingerprintHash);
      return;
    }

    // Dispositivo nuevo — respetar límite de 5
    const count = await trustedDeviceRepository.countByUser(user.id);
    if (count >= 5) {
      await trustedDeviceRepository.deleteOldest(user.id);
    }

    const deviceName = DeviceFingerprintUtil.generateDeviceName(auditContext.userAgent);

    await trustedDeviceRepository.create({
      user_id:          user.id,
      fingerprint_hash: fingerprintHash,
      device_name:      deviceName,
      trusted_at:       new Date(),
      last_seen_at:     new Date(),
    });

    logger.info('New trusted device registered', { userId: user.id, deviceName });

    const firstName = user.person?.first_name || 'Usuario';
    const email     = user.person?.contact?.email;

    NotificationUtil.crearNotificacion({
      tipo_notificacion: 'NUEVO_DISPOSITIVO_DETECTADO',
      user_id:           user.id,
      related_entity:    null,
      metadata: {
        nombre:      firstName,
        email,
        ip:          auditContext.ip,
        userAgent:   auditContext.userAgent,
        deviceName,
        fechaAcceso: new Date().toISOString(),
      },
    }).catch(err => logger.error('Error sending new device notification', { error: err.message }));
  }
}

module.exports = new AuthLoginService();