'use strict';

const { sequelize }    = require('../../../../shared/models');
const userRepository   = require('../../repositories/user.repository');
const KycSharedUtil    = require('../../utils/kyc.util');
const CognitoUtil      = require('../../../../shared/utils/cognito.util');
const NotificationUtil = require('../../../notification/src/services/notification-creation.service');
const AppError         = require('../../../../shared/utils/app-error.util');
const { logger }       = require('../../../../shared/utils/logger.util');
const { security }     = require('../../../../shared/constants');
const bcrypt           = require('bcryptjs');

const {
  TOTPSetupResponseDTO,
  TOTPActivationResponseDTO,
  TOTPVerificationResponseDTO,
  PasswordValidationResponseDTO,
} = require('../dtos/mfa.dto');

class MFAService {

  /**
   * Configura TOTP para el usuario.
   * Genera el secret code y retorna otpauth URL para QR.
   *
   * @param {object} data         - { accessToken }
   * @param {object} tokenPayload - { userId, username, totpEnabled }
   * @returns {Promise<TOTPSetupResponseDTO>}
   */
  async setupTOTP(data, tokenPayload) {
    const { accessToken }                = data;
    const { username, userId, totpEnabled } = tokenPayload;

    if (totpEnabled) {
      throw AppError.conflict('TOTP ya está activado para este usuario');
    }

    const { secretCode } = await CognitoUtil.associateSoftwareToken(accessToken);
    const otpauthUrl     = this._generateOtpauthURL(username, secretCode);

    logger.info('TOTP setup initiated', { userId, username });

    return new TOTPSetupResponseDTO({ otpauthUrl, secretCode, username });
  }

  /**
   * Verifica el código TOTP y activa MFA si es correcto.
   *
   * Orden de operaciones:
   *   1. Verificar código en Cognito (si falla aquí, no hay rollback necesario)
   *   2. Habilitar TOTP en Cognito  ← cognitoEnabled = true
   *   3. Actualizar BD + audit log  ← si falla, revertir Cognito
   *
   * Usamos bandera booleana para saber si Cognito llegó a habilitarse,
   * evitando comparar strings de mensajes de error que pueden cambiar.
   *
   * @param {object} data         - { accessToken, totpCode }
   * @param {object} tokenPayload - { userId, username, firstName, cognitoUsername, totpEnabled }
   * @param {object} auditContext - { ipAddress, userAgent }
   * @returns {Promise<TOTPActivationResponseDTO>}
   */
  async verifyAndActivateTOTP(data, tokenPayload, auditContext) {
    const { accessToken, totpCode }                              = data;
    const { username, firstName, totpEnabled, userId, cognitoUsername } = tokenPayload;

    if (totpEnabled) {
      throw AppError.conflict('TOTP ya está activado');
    }

    // Verificar código antes de abrir transacción — si el código es inválido
    // no tiene sentido iniciar ni Cognito ni la BD
    const verificationResult = await CognitoUtil.verifySoftwareToken(accessToken, totpCode);
    if (verificationResult.status !== 'SUCCESS') {
      throw AppError.badRequest('Código TOTP inválido');
    }

    // Bandera: solo true si Cognito llegó a habilitarse
    let cognitoEnabled = false;
    const transaction  = await sequelize.transaction();

    try {
      await CognitoUtil.enableTOTPMFA(accessToken);
      cognitoEnabled = true;

      await userRepository.updateTOTPStatus(userId, true, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: userId,
        changedByRole:   'user',
        changeType:      'mfa_status',
        previousValue:   'disabled',
        newValue:        'enabled',
        changeReason:    'MFA activado por cliente',
        ipAddress:       auditContext.ipAddress,
        userAgent:       auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      logger.info('TOTP activated successfully', { userId, username });

      setImmediate(() => {
        this._enviarNotificacion('TOTP_ACTIVADO', userId, { nombre: firstName })
          .catch(err => logger.error('Error enviando notificación TOTP activado', {
            error: err.message,
            userId,
          }));
      });

      return new TOTPActivationResponseDTO({ userId, username, totpEnabled: true });

    } catch (error) {
      await transaction.rollback();

      // Revertir Cognito solo si llegó a habilitarse
      if (cognitoEnabled) {
        await CognitoUtil.disableTOTPMFA(cognitoUsername)
          .catch(err => logger.error('Error en rollback de Cognito TOTP', {
            userId,
            error: err.message,
          }));
      }

      throw error;
    }
  }

  /**
   * Verifica un código TOTP sin activar ni desactivar nada.
   * Usado para validaciones de seguridad adicionales.
   *
   * @param {object} data         - { accessToken, totpCode }
   * @param {object} tokenPayload - { userId, username, totpEnabled }
   * @returns {Promise<TOTPVerificationResponseDTO>}
   */
  async verifyTOTP(data, tokenPayload) {
    const { accessToken, totpCode }          = data;
    const { username, totpEnabled, userId }  = tokenPayload;

    if (!totpEnabled) {
      throw AppError.badRequest('TOTP no está activado para este usuario');
    }

    const verificationResult = await CognitoUtil.verifySoftwareToken(accessToken, totpCode);
    const isValid            = verificationResult.status === 'SUCCESS';

    logger.info('TOTP verification attempt', { userId, username, success: isValid });

    return new TOTPVerificationResponseDTO({ valid: isValid, username });
  }

  /**
   * Desactiva TOTP para el usuario.
   * Requiere validación de contraseña por seguridad.
   *
   * Orden de operaciones:
   *   1. Deshabilitar TOTP en Cognito  ← cognitoDisabled = true
   *   2. Actualizar BD + audit log     ← si falla, revertir Cognito
   *
   * @param {object} data         - { password }
   * @param {object} tokenPayload - { userId, username, firstName, cognitoUsername, totpEnabled, passwordHash }
   * @param {object} auditContext - { ipAddress, userAgent }
   * @returns {Promise<TOTPActivationResponseDTO>}
   */
  async deactivateTOTP(data, tokenPayload, auditContext) {
    const { password }                                                          = data;
    const { cognitoUsername, username, firstName, totpEnabled, passwordHash, userId } = tokenPayload;

    if (!totpEnabled) {
      throw AppError.badRequest('TOTP no está activado');
    }

    const isPasswordValid = await bcrypt.compare(password, passwordHash);
    if (!isPasswordValid) {
      throw AppError.unauthorized('Contraseña incorrecta');
    }

    // Bandera: solo true si Cognito llegó a deshabilitarse
    let cognitoDisabled = false;
    const transaction   = await sequelize.transaction();

    try {
      await CognitoUtil.disableTOTPMFA(cognitoUsername);
      cognitoDisabled = true;

      await userRepository.updateTOTPStatus(userId, false, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: userId,
        changedByRole:   'user',
        changeType:      'mfa_status',
        previousValue:   'enabled',
        newValue:        'disabled',
        changeReason:    'MFA desactivado por cliente',
        ipAddress:       auditContext.ipAddress,
        userAgent:       auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      logger.info('TOTP deactivated successfully', { userId, username });

      setImmediate(() => {
        this._enviarNotificacion('TOTP_ELIMINADO', userId, { nombre: firstName })
          .catch(err => logger.error('Error enviando notificación TOTP eliminado', {
            error: err.message,
            userId,
          }));
      });

      return new TOTPActivationResponseDTO({ userId, username, totpEnabled: false });

    } catch (error) {
      await transaction.rollback();

      // Revertir Cognito solo si llegó a deshabilitarse
      if (cognitoDisabled) {
        await CognitoUtil.enableTOTPMFA(cognitoUsername)
          .catch(err => logger.error('Error en rollback de Cognito TOTP', {
            userId,
            error: err.message,
          }));
      }

      throw error;
    }
  }

  /**
   * Valida la contraseña del usuario.
   * Útil para validaciones de seguridad adicionales en el frontend.
   *
   * @param {object} data         - { password }
   * @param {object} tokenPayload - { username, passwordHash }
   * @returns {Promise<PasswordValidationResponseDTO>}
   */
  async validatePassword(data, tokenPayload) {
    const { password }              = data;
    const { username, passwordHash } = tokenPayload;

    const isValid = await bcrypt.compare(password, passwordHash);

    logger.info('Password validation attempt', { username, success: isValid });

    return new PasswordValidationResponseDTO({ valid: isValid, username });
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  /**
   * Genera la URL otpauth para códigos QR TOTP.
   * Formato: otpauth://totp/Issuer:username?secret=SECRET&issuer=Issuer
   * @private
   */
  _generateOtpauthURL(username, secretCode) {
    const issuer          = encodeURIComponent(security.totpIssuer);
    const encodedUsername = encodeURIComponent(username);
    return `otpauth://totp/${issuer}:${encodedUsername}?secret=${secretCode}&issuer=${issuer}`;
  }

  /**
   * Envía una notificación al usuario de forma segura.
   * Los errores se loguean pero no propagan — las notificaciones nunca deben
   * interrumpir el flujo principal.
   * @private
   */
  async _enviarNotificacion(tipo, userId, metadata) {
    try {
      await NotificationUtil.crearNotificacion({
        tipo_notificacion: tipo,
        user_id:           userId,
        related_entity:    null,
        metadata,
      });
      logger.info('Notificación enviada', { userId, tipo });
    } catch (error) {
      logger.error('Error al enviar notificación', { error: error.message, userId, tipo });
    }
  }
}

module.exports = new MFAService();