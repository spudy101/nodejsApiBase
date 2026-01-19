'use strict';

const userRepository = require('../repositories/user.repository');
const KycSharedUtil = require('../utils/kycShared.util');
const CognitoUtil = require('../utils/cognito.util');
const AppError = require('../utils/appError.util');
const { logger } = require('../utils/logger.util');
const { sequelize } = require('../models');
const { TOTPSetupResponseDTO, TOTPActivationResponseDTO, TOTPVerificationResponseDTO, PasswordValidationResponseDTO } = require('../dtos/kycMFA.dto');

class KycMFAService {
  /**
   * Configura TOTP para el usuario
   * Genera el secret code y retorna otpauth URL para QR
   * 
   * @param {object} data - { accessToken }
   * @param {object} tokenPayload - { sub, username } del JWT decodificado
   * @returns {Promise<TOTPSetupResponseDTO>}
   */
  async setupTOTP(data, tokenPayload) {
    const { accessToken } = data;
    const { username, userId, totpEnabled } = tokenPayload;

    // 2. Verificar que TOTP no esté ya activado
    if (totpEnabled) {
      throw AppError.conflict('TOTP ya está activado para este usuario');
    }

    // 3. Asociar software token en Cognito
    const { secretCode } = await CognitoUtil.associateSoftwareToken(accessToken);

    // 4. Generar otpauth URL para QR
    const otpauthUrl = this._generateOtpauthURL(username, secretCode);

    logger.info('TOTP setup initiated', { userId, username });

    return new TOTPSetupResponseDTO({
      otpauthUrl,
      secretCode,
      username,
    });
  }

  /**
   * Verifica el código TOTP y activa MFA si es correcto
   * ✅ CORREGIDO: Ahora usa transacciones y rollback completo
   * 
   * @param {object} data - { accessToken, totpCode }
   * @param {object} tokenPayload - { sub, username } del JWT decodificado
   * @returns {Promise<TOTPActivationResponseDTO>}
   */
  async verifyAndActivateTOTP(data, tokenPayload, auditContext) {
    const { accessToken, totpCode } = data;
    const { username, firstName, totpEnabled, userId, cognitoUsername } = tokenPayload;

    // 2. Verificar que TOTP no esté ya activado
    if (totpEnabled) {
      throw AppError.conflict('TOTP ya está activado');
    }

    const transaction = await sequelize.transaction();

    try {
      // 3. Verificar código TOTP en Cognito
      const verificationResult = await CognitoUtil.verifySoftwareToken(accessToken, totpCode);

      if (verificationResult.status !== 'SUCCESS') {
        throw AppError.badRequest('Código TOTP inválido');
      }

      // 4. Activar TOTP como MFA preferido en Cognito
      await CognitoUtil.enableTOTPMFA(accessToken);

      // 5. Actualizar flag en BD (dentro de transacción)
      await userRepository.updateTOTPStatus(userId, true, { transaction });

      // 6. Registrar cambio (dentro de transacción)
      await KycSharedUtil.logChange({
        userId: userId,
        changedByUserId: userId,
        changedByRole: 'user',
        changeType: 'mfa_status',
        previousValue: 'disabled',
        newValue: 'enabled',
        changeReason: 'MFA activado por cliente',
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      logger.info('TOTP activated successfully', { userId, username });

      // 7. Notificación asíncrona (fuera de transacción)
      setImmediate(() => {
        this._enviarNotificacionTOTP('TOTP_ACTIVADO', userId, firstName, 'activado')
          .catch(err => {
            logger.error('Error enviando notificación de MFA activada', {
              error: err.message,
              userId
            });
          });
      });

      return new TOTPActivationResponseDTO({
        userId,
        username,
        totpEnabled: true,
      });

    } catch (error) {
      await transaction.rollback();

      // Rollback de Cognito si fue activado
      if (error.message !== 'Código TOTP inválido') {
        try {
          await CognitoUtil.disableTOTPMFA(cognitoUsername);
          logger.info('Cognito TOTP rollback completed', { userId });
        } catch (rollbackError) {
          logger.error('Error en rollback de Cognito TOTP', {
            userId,
            error: rollbackError.message
          });
        }
      }

      logger.error('Error activating TOTP', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Verifica un código TOTP (para login con MFA u otras validaciones)
   * 
   * @param {object} data - { accessToken, totpCode }
   * @param {object} tokenPayload - { sub, username } del JWT decodificado
   * @returns {Promise<TOTPVerificationResponseDTO>}
   */
  async verifyTOTP(data, tokenPayload) {
    const { accessToken, totpCode } = data;
    const { username, totpEnabled, userId } = tokenPayload;

    // 2. Verificar que TOTP esté activado
    if (!totpEnabled) {
      throw AppError.badRequest('TOTP no está activado para este usuario');
    }

    // 3. Verificar código en Cognito
    const verificationResult = await CognitoUtil.verifySoftwareToken(accessToken, totpCode);

    const isValid = verificationResult.status === 'SUCCESS';

    logger.info('TOTP verification attempt', { 
      userId, 
      username, 
      success: isValid 
    });

    return new TOTPVerificationResponseDTO({
      valid: isValid,
      username,
    });
  }

  /**
   * Desactiva TOTP para el usuario
   * Requiere validación de contraseña por seguridad
   * ✅ CORREGIDO: Ahora usa transacciones y rollback completo
   * 
   * @param {object} data - { password }
   * @param {object} tokenPayload - { sub, username } del JWT decodificado
   * @returns {Promise<TOTPActivationResponseDTO>}
   */
  async deactivateTOTP(data, tokenPayload, auditContext) {
    const { password } = data;
    const { cognitoUsername, username, firstName, totpEnabled, passwordHash, userId } = tokenPayload;

    // 2. Verificar que TOTP esté activado
    if (!totpEnabled) {
      throw AppError.badRequest('TOTP no está activado');
    }

    // 3. Validar contraseña
    const isPasswordValid = await userRepository.verifyPassword(password, passwordHash);
    
    if (!isPasswordValid) {
      throw AppError.unauthorized('Contraseña incorrecta');
    }

    const transaction = await sequelize.transaction();

    try {
      // 4. Desactivar TOTP en Cognito
      await CognitoUtil.disableTOTPMFA(cognitoUsername);

      // 5. Actualizar flag en BD (dentro de transacción)
      await userRepository.updateTOTPStatus(userId, false, { transaction });

      // 6. Registrar cambio (dentro de transacción)
      await KycSharedUtil.logChange({
        userId: userId,
        changedByUserId: userId,
        changedByRole: 'user',
        changeType: 'mfa_status',
        previousValue: 'enabled',
        newValue: 'disabled',
        changeReason: 'MFA desactivado por cliente',
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      logger.info('TOTP deactivated successfully', { userId, username });

      // 7. Notificación asíncrona (fuera de transacción)
      setImmediate(() => {
        this._enviarNotificacionTOTP('TOTP_ELIMINADO', userId, firstName, 'desactivado')
          .catch(err => {
            logger.error('Error enviando notificación de MFA desactivado', {
              error: err.message,
              userId: userId
            });
          });
      });

      return new TOTPActivationResponseDTO({
        userId,
        username,
        totpEnabled: false,
      });

    } catch (error) {
      await transaction.rollback();

      // Rollback de Cognito si fue desactivado
      try {
        await CognitoUtil.enableTOTPMFA(cognitoUsername);
        logger.info('Cognito TOTP rollback completed', { userId });
      } catch (rollbackError) {
        logger.error('Error en rollback de Cognito TOTP', {
          userId,
          error: rollbackError.message
        });
      }

      logger.error('Error deactivating TOTP', { userId, error: error.message });
      throw error;
    }
  }

  /**
   * Valida la contraseña del usuario
   * Útil para validaciones adicionales en el frontend
   * 
   * @param {object} data - { password }
   * @param {object} tokenPayload - { sub, username } del JWT decodificado
   * @returns {Promise<PasswordValidationResponseDTO>}
   */
  async validatePassword(data, tokenPayload) {
    const { password } = data;
    const { username, passwordHash } = tokenPayload;

    // Validar contraseña en Cognito
    const isValid = await userRepository.verifyPassword(password, passwordHash);

    logger.info('Password validation attempt', { username, success: isValid });

    return new PasswordValidationResponseDTO({
      valid: isValid,
      username,
    });
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Genera la URL otpauth para códigos QR TOTP
   * Formato: otpauth://totp/Issuer:username?secret=SECRETCODE&issuer=Issuer
   * @private
   */
  _generateOtpauthURL(username, secretCode) {
    const issuer = encodeURIComponent(process.env.TOTP_ISSUER || 'DemocraciaLiquida');
    const encodedUsername = encodeURIComponent(username);

    return `otpauth://totp/${issuer}:${encodedUsername}?secret=${secretCode}&issuer=${issuer}`;
  }

  /**
   * Envía notificación relacionada con TOTP
   * ✅ REFACTORIZADO: Método genérico unificado
   * @private
   */
  async _enviarNotificacionTOTP(tipoNotificacion, userId, firstName, accion) {
    try {
      const NotificationUtil = require('../utils/notification.util');
      
      await NotificationUtil.crearNotificacion({
        tipo_notificacion: tipoNotificacion,
        user_id: userId,
        related_entity: null,
        metadata: {
          nombre: firstName
        }
      });

      logger.info(`Notificación de MFA ${accion} enviada correctamente`, { userId });
    } catch (error) {
      // No lanzar error, solo loguear
      logger.error(`Error al enviar notificación de MFA ${accion}`, {
        error: error.message,
        userId
      });
    }
  }
}

module.exports = new KycMFAService();