'use strict';

const { sequelize }              = require('../../../../shared/models');
const verificationCodeRepository = require('../../../kyc/repositories/verification-code.repository');
const NotificationUtil           = require('../../../notification/src/services/notification.service');
const AppError                   = require('../../../../shared/utils/app-error.util');
const { logger }                 = require('../../../../shared/utils/logger.util');
const { server }                 = require('../../../../shared/constants');
const crypto                     = require('crypto');

const {
  SendVerificationResponseDTO,
  VerifyCodeResponseDTO,
} = require('../dtos/send-verification.dto');

class VerificationService {

  /**
   * Envía código de verificación a email o teléfono.
   *
   * El código se persiste en BD antes de enviarlo.
   * El envío va en setImmediate — un fallo de notificación no revierte
   * el código creado, ya que el usuario podría reintentar el envío.
   *
   * Rate limit: 60 segundos entre solicitudes por contact.
   *
   * @param {object} data - { type, contact, phone_prefix_id? }
   * @returns {Promise<SendVerificationResponseDTO>}
   */
  async sendVerificationCode(data) {
    const { type, contact, phone_prefix_id } = data;

    const canRequest = await verificationCodeRepository.canRequestNewCode(type, contact);
    if (!canRequest) {
      throw AppError.tooManyRequests('Debes esperar 60 segundos antes de solicitar un nuevo código');
    }

    const code      = this._generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    const transaction = await sequelize.transaction();

    try {
      const verificationCode = await verificationCodeRepository.create({
        type,
        contact_value: contact,
        code,
        attempts:      0,
        expires_at:    expiresAt,
      }, { transaction });

      await transaction.commit();

      logger.info('Verification code created', {
        type,
        contact,
        codeId:    verificationCode.id,
        expiresAt,
      });

      // Envío fuera de la transacción — fallo de notificación no revierte el código
      setImmediate(() => {
        this._sendCode(type, contact, phone_prefix_id, code)
          .catch(err => logger.error('Error sending verification code', {
            error:   err.message,
            type,
            contact,
            codeId:  verificationCode.id,
          }));
      });

      return new SendVerificationResponseDTO({ verificationCode });

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Verifica el código enviado a email o teléfono.
   *
   * Flujo de código incorrecto:
   *   - Incrementa intentos en BD
   *   - Lanza error con intentos restantes
   *   - Máximo 5 intentos — después debe solicitar nuevo código
   *
   * Flujo de código correcto:
   *   - Marca como verificado en BD
   *   - El código queda disponible para que otros servicios validen
   *     que el contact fue efectivamente verificado
   *
   * @param {object} data - { type, contact, code }
   * @returns {Promise<VerifyCodeResponseDTO>}
   */
  async verifyCode(data) {
    const { type, contact, code } = data;

    const verificationCode = await verificationCodeRepository.findActiveByContact(type, contact);

    if (!verificationCode) {
      throw AppError.notFound('Código de verificación no encontrado o expirado');
    }

    if (verificationCode.verified_at) {
      throw AppError.badRequest('Este código ya fue utilizado');
    }

    if (verificationCode.attempts >= 5) {
      throw AppError.forbidden('Excediste el número máximo de intentos. Solicita un nuevo código');
    }

    if (verificationCode.code !== code) {
      await this._handleInvalidCode(verificationCode, type, contact);
    }

    // Código correcto — marcar como verificado
    const transaction = await sequelize.transaction();

    try {
      await verificationCodeRepository.markAsVerified(verificationCode.id, { transaction });
      await transaction.commit();

      logger.info('Verification code verified successfully', {
        type,
        contact,
        codeId: verificationCode.id,
      });

      return new VerifyCodeResponseDTO();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  /**
   * Maneja un intento con código incorrecto:
   * persiste el incremento de intentos y lanza el error con intentos restantes.
   *
   * El throw va DESPUÉS del commit para asegurar que el incremento
   * quedó persistido antes de responder al cliente.
   *
   * @private
   */
  async _handleInvalidCode(verificationCode, type, contact) {
    const transaction = await sequelize.transaction();

    try {
      await verificationCodeRepository.incrementAttempts(verificationCode.id, { transaction });
      await transaction.commit();

      const remainingAttempts = 5 - (verificationCode.attempts + 1);

      logger.warn('Invalid verification code attempt', {
        type,
        contact,
        codeId:            verificationCode.id,
        attempts:          verificationCode.attempts + 1,
        remainingAttempts,
      });

      // Throw después del commit — la transacción ya está cerrada
      throw AppError.badRequest(
        `Código inválido. Te quedan ${remainingAttempts} intento${remainingAttempts !== 1 ? 's' : ''}`
      );

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Genera código de 6 dígitos.
   * En desarrollo siempre retorna '123456' para facilitar pruebas
   * sin necesidad de recibir emails o SMS reales.
   * @private
   */
  _generateCode() {
    if (server.nodeEnv === 'development') {
      return '123456';
    }
    return crypto.randomInt(100000, 999999).toString();
  }

  /** @private */
  async _sendCode(type, contact, phone_prefix_id, code) {
    if (type === 'email') {
      await this._sendEmailCode(contact, code);
    } else if (type === 'phone') {
      await this._sendSMSCode(contact, phone_prefix_id, code);
    }
  }

  /** @private */
  async _sendEmailCode(email, code) {
    await NotificationUtil.crearNotificacionDirecta({
      tipo_notificacion: 'CODIGO_VERIFICACION',
      email,
      metadata: {
        codigo:            code,
        minutosExpiracion: 15,
      },
    });

    logger.info('Verification email sent successfully', { email });
  }

  /**
   * SMS pendiente de implementación.
   * Por ahora loguea el código para pruebas manuales en desarrollo.
   * @private
   */
  async _sendSMSCode(phone, phone_prefix_id, code) {
    logger.info('SMS verification code (PENDING IMPLEMENTATION)', {
      phone,
      phone_prefix_id,
      code,
      message: `Tu código de verificación es: ${code}. Expira en 15 minutos.`,
    });
  }
}

module.exports = new VerificationService();