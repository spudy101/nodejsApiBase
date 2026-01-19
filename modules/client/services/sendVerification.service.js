'use strict';

const verificationCodeRepository = require('../../../shared/repositories/verificationCode.repository');
const { SendVerificationResponseDTO, VerifyCodeResponseDTO } = require('../dtos/sendVerification.dto');
const AppError = require('../../../shared/utils/appError.util');
const { logger } = require('../../../shared/utils/logger.util');
const SESUtil = require('../../../shared/utils/SES.util');
const { sequelize } = require('../../../shared/models');
const crypto = require('crypto');
const { server } = require('../../../shared/constants');

class VerificationService {
  /**
   * Envía código de verificación a email o teléfono
   */
  async sendVerificationCode(data) {
    const { type, contact, phone_prefix_id } = data;

    const canRequest = await verificationCodeRepository.canRequestNewCode(type, contact);

    if (!canRequest) {
      throw AppError.tooManyRequests(
        'Debes esperar 60 segundos antes de solicitar un nuevo código'
      );
    }

    const code = this._generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const transaction = await sequelize.transaction();

    try {
      const verificationCode = await verificationCodeRepository.create({
        type,
        contact_value: contact,
        code,
        attempts: 0,
        expires_at: expiresAt,
      }, { transaction });

      await transaction.commit();

      logger.info('Verification code created', {
        type,
        contact,
        codeId: verificationCode.verification_code_id,
        expiresAt,
      });

      setImmediate(() => {
        this._sendCode(type, contact, phone_prefix_id, code)
          .catch(err => {
            logger.error('Error sending verification code', {
              error: err.message,
              type,
              contact,
              codeId: verificationCode.verification_code_id
            });
          });
      });

      return new SendVerificationResponseDTO({ verificationCode });

    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating verification code', { type, contact, error: error.message });
      throw error;
    }
  }

  /**
   * Verifica código enviado a email o teléfono
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
      throw AppError.forbidden(
        'Excediste el número máximo de intentos. Solicita un nuevo código'
      );
    }

    if (verificationCode.code !== code) {
      const transaction = await sequelize.transaction();

      try {
        await verificationCodeRepository.incrementAttempts(
          verificationCode.verification_code_id,
          { transaction }
        );

        await transaction.commit();

        const remainingAttempts = 5 - (verificationCode.attempts + 1);

        logger.warn('Invalid verification code attempt', {
          type,
          contact,
          codeId: verificationCode.verification_code_id,
          attempts: verificationCode.attempts + 1,
          remainingAttempts
        });

        throw AppError.badRequest(
          `Código inválido. Te quedan ${remainingAttempts} intento${remainingAttempts !== 1 ? 's' : ''}`
        );

      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }

    const transaction = await sequelize.transaction();

    try {
      await verificationCodeRepository.markAsVerified(
        verificationCode.verification_code_id,
        { transaction }
      );

      await transaction.commit();

      logger.info('Verification code verified successfully', {
        type,
        contact,
        codeId: verificationCode.verification_code_id,
      });

      return new VerifyCodeResponseDTO();

    } catch (error) {
      await transaction.rollback();
      logger.error('Error marking code as verified', {
        type,
        contact,
        codeId: verificationCode.verification_code_id,
        error: error.message
      });
      throw error;
    }
  }

  _generateCode() {
    if (server.nodeEnv === 'development') {
      return '123456';
    }
    return crypto.randomInt(100000, 999999).toString();
  }

  async _sendCode(type, contact, phone_prefix_id, code) {
    if (type === 'email') {
      await this._sendEmailCode(contact, code);
    } else if (type === 'phone') {
      await this._sendSMSCode(contact, phone_prefix_id, code);
    }
  }

  async _sendEmailCode(email, code) {
    const asunto = 'Código de verificación - Democracia Líquida';
    const cuerpoHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">Código de verificación</h2>
          
          <p style="color: #555; line-height: 1.6;">
            Tu código de verificación es:
          </p>
          
          <div style="background-color: #f4f4f4; padding: 20px; margin: 25px 0; text-align: center; border-radius: 8px; border: 2px dashed #007bff;">
            <span style="font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${code}
            </span>
          </div>
          
          <p style="color: #d9534f; padding: 15px; background-color: #fff3cd; border-left: 4px solid #ffc107; border-radius: 4px; margin-top: 20px;">
            ⏱️ Este código expira en <strong>15 minutos</strong>.
          </p>
          
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
          </p>
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          
          <p style="color: #999; font-size: 12px; text-align: center;">
            © ${new Date().getFullYear()} Democracia Líquida. Todos los derechos reservados.
          </p>
        </div>
      </body>
      </html>
    `;
    
    const cuerpoTexto = `
      Código de verificación - Democracia Líquida
      
      Tu código de verificación es: ${code}
      
      Este código expira en 15 minutos.
      
      Si no solicitaste este código, puedes ignorar este mensaje.
    `;
    
    await SESUtil.enviarEmail(email, asunto, cuerpoHtml, cuerpoTexto);
    
    logger.info('Verification email sent successfully', { email });
  }

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