'use strict';

const userRepository = require('../../../shared/repositories/user.repository');
const personRepository = require('../../../shared/repositories/person.repository');
const personContactRepository = require('../../../shared/repositories/personContact.repository');
const resetCredentialsRepository = require('../repositories/resetCredentials.repository');
const userNotificationPreferenceRepository = require('../../../shared/repositories/userNotificationPreference.repository');
const CognitoUtil = require('../../../shared/utils/cognito.util');
const SESUtil = require('../../../shared/utils/SES.util');
const NotificationUtil = require('../../../shared/utils/notification.util');
const AppError = require('../../../shared/utils/appError.util');
const { logger } = require('../../../shared/utils/logger.util');
const { RegisterResponseDTO } = require('../dtos/auth.dto');
const { sequelize } = require('../../../shared/models');
const crypto = require('crypto');
const { frontend, security, USER_ROLES } = require('../../../shared/constants/index');

class AuthClientService {

  /**
   * Registra un nuevo usuario en el sistema
   * @param {Object} userData - Datos del usuario a registrar
   * @returns {RegisterResponseDTO} Datos del usuario registrado con tokens
   */
  async register(userData) {
    const { email, password, firstName, lastName, nationalId, genderId, countryId } = userData;

    await this._validateRegistration(email, nationalId);

    const { user, person, personContact } = await this._createUserInDB({
      email,
      firstName,
      lastName,
      nationalId,
      genderId,
      countryId,
      password,
    });

    let tokens;
    try {
      const cognitoUser = await CognitoUtil.createUser({ nationalId, email, password });
      await userRepository.updateCognitoSub(user.user_id, cognitoUser.sub);
      tokens = await CognitoUtil.authenticateUser(nationalId, password);
      
      logger.info('User registered successfully', { userId: user.user_id, email });

      setImmediate(() => {
        this._enviarNotificacion('BIENVENIDA', user.user_id, firstName)
          .catch(err => logger.error('Error enviando notificación de bienvenida', {
            error: err.message,
            userId: user.user_id
          }));
      });

    } catch (error) {
      await this._rollbackRegistration(user.user_id, personContact.person_contact_id, person.person_id, nationalId);
      
      logger.error('Error in registration after DB creation', { 
        error: error.message,
        userId: user.user_id,
        stage: 'cognito_creation'
      });
      
      throw AppError.serverError('Error al crear usuario. Intenta nuevamente');
    }

    return new RegisterResponseDTO({ user, person, personContact, tokens });
  }

  /**
   * Solicita reset de credenciales (password o MFA)
   * @param {Object} data - Email y tipo de reset
   * @returns {null}
   */
  async requestResetCredentials(data) {
    const { email, type } = data;

    const personContact = await personContactRepository.findByEmail(email);

    if (!personContact) {
      logger.info('Reset requested for non-existent email', { email, type });
      return null;
    }

    const user = await userRepository.findByPersonId(personContact.person_id);

    if (!user || !user.is_active) {
      logger.info('Reset requested for inactive user', { email, type });
      return null;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + security.expirationMinutes * 60 * 1000);

    await resetCredentialsRepository.create({
      user_id: user.user_id,
      token,
      type,
      expires_at: expiresAt,
    });

    const resetUrl = `${frontend.resetCredentialUrl}?token=${token}&type=${type}`;

    setImmediate(() => {
      this._sendResetEmail(email, user.person.first_name, resetUrl, type)
        .catch(err => logger.error('Error sending reset email', { error: err.message }));
    });

    logger.info('Reset credentials requested', { userId: user.user_id, type });

    return null;
  }

  /**
   * Confirma el reset de credenciales con el token recibido
   * @param {Object} data - Token, nueva contraseña (opcional) y tipo de reset
   * @returns {null}
   */
  async confirmResetCredentials(data) {
    const { token, newPassword, type } = data;

    const resetRecord = await resetCredentialsRepository.findValidToken(token);

    if (!resetRecord) {
      throw AppError.badRequest('Token inválido o expirado');
    }

    if (resetRecord.type !== type) {
      throw AppError.badRequest('Tipo de reset incorrecto');
    }

    const transaction = await sequelize.transaction();

    try {
      const user = await userRepository.findById(resetRecord.user_id, {
        include: [{ association: 'person' }]
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      if (type === 'password') {
        if (!newPassword) {
          throw AppError.badRequest('La nueva contraseña es requerida');
        }
        await userRepository.updatePassword(user.user_id, newPassword, { transaction });
        await CognitoUtil.changeUserPassword(user.person.national_id, newPassword);
        logger.info('Password reset successful', { userId: user.user_id });
      } else if (type === 'mfa') {
        await CognitoUtil.disableTOTPMFA(user.person.national_id);
        await userRepository.updateTOTPStatus(user.user_id, false, { transaction });
        logger.info('MFA reset successful', { userId: user.user_id });
      }

      await resetCredentialsRepository.markAsUsed(resetRecord.reset_credentials_id, { transaction });

      await transaction.commit();

      const email = user.person.contact?.email;
      if (email) {
        setImmediate(() => {
          this._sendResetConfirmationEmail(email, user.person.first_name, type)
            .catch(err => logger.error('Error sending confirmation email', { error: err.message }));
        });
      }

      return null;

    } catch (error) {
      await transaction.rollback();
      logger.error('Error confirming reset credentials', { error: error.message });
      throw error;
    }
  }

  /**
   * Valida que el email y nationalId no estén registrados
   * @private
   */
  async _validateRegistration(email, nationalId) {
    const existingContact = await personContactRepository.findByEmail(email);
    const existingUser = await personRepository.findByNationalId(nationalId);

    if (existingContact) throw AppError.conflict('El email ya está registrado');
    if (existingUser) throw AppError.conflict('El usuario ya existe');
  }

  /**
   * Crea el usuario, persona y contacto en la base de datos
   * @private
   */
  async _createUserInDB({ email, firstName, lastName, nationalId, genderId, countryId, password }) {
    const transaction = await sequelize.transaction();

    try {
      // Buscar el rol por nombre en lugar de usar un ID fijo
      const defaultRole = await roleRepository.findByName(USER_ROLES.USER, { transaction });
      
      if (!defaultRole) {
        throw new Error(`Role ${USER_ROLES.USER} not found in database`);
      }

      const person = await personRepository.create({
        first_name: firstName,
        last_name: lastName,
        national_id: nationalId,
        gender_id: genderId || null,
        country_id: countryId || null,
      }, { transaction });

      const personContact = await personContactRepository.create({
        person_id: person.person_id,
        email,
        email_verified_at: new Date(),
      }, { transaction });

      const user = await userRepository.create({
        username: nationalId,
        password,
        person_id: person.person_id,
        role_id: defaultRole.role_id, // Usar el ID obtenido dinámicamente
        cognito_sub: null,
      }, { transaction });

      await userNotificationPreferenceRepository.create({
        user_id: user.user_id,
        notification_type_code: null,
        allow_push: true,
        allow_email: true,
        quiet_hours_start: null,
        quiet_hours_end: null
      }, { transaction });

      await transaction.commit();
      
      logger.info('User created in DB', { userId: user.user_id, roleId: defaultRole.role_id });
      
      return { user, person, personContact };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating user in DB', { error: error.message });
      throw error;
    }
  }

  /**
   * Revierte el registro en caso de error en Cognito
   * @private
   */
  async _rollbackRegistration(userId, personContactId, personId, nationalId) {
    try {
      await CognitoUtil.deleteUser(nationalId).catch(() => {});
      await userNotificationPreferenceRepository.bulkDelete({ user_id: userId });
      await userRepository.delete(userId);
      await personContactRepository.delete(personContactId);
      await personRepository.delete(personId);
      
      logger.info('Registration rollback completed', { userId });
    } catch (error) {
      logger.error('Error in rollback', { error: error.message });
    }
  }

  /**
   * Envía notificación de bienvenida al usuario
   * @private
   */
  async _enviarNotificacion(tipo, userId, firstName) {
    try {
      await NotificationUtil.crearNotificacion({
        tipo_notificacion: tipo,
        user_id: userId,
        related_entity: null,
        metadata: { nombre: firstName }
      });

      logger.info('Notificación enviada', { userId, tipo });
    } catch (error) {
      logger.error('Error al enviar notificación', { error: error.message, userId, tipo });
    }
  }

  /**
   * Envía email con enlace para reset de credenciales
   * @private
   */
  async _sendResetEmail(email, firstName, resetUrl, type) {
    const subject = type === 'password' 
      ? 'Recuperación de Contraseña'
      : 'Desactivación de MFA';

    const message = type === 'password'
      ? `Haz clic en el siguiente enlace para restablecer tu contraseña: ${resetUrl}`
      : `Haz clic en el siguiente enlace para desactivar tu MFA: ${resetUrl}`;

    const htmlBody = `
      <h2>Hola ${firstName},</h2>
      <p>${message}</p>
      <p>Este enlace expirará en ${security.expirationMinutes} minutos.</p>
      <p>Si no solicitaste este cambio, ignora este correo.</p>
    `;

    await SESUtil.enviarEmail(email, subject, htmlBody, message);
    logger.info('Reset email sent', { email, type });
  }

  /**
   * Envía email de confirmación de reset exitoso
   * @private
   */
  async _sendResetConfirmationEmail(email, firstName, type) {
    const subject = type === 'password' ? 'Contraseña Actualizada' : 'MFA Desactivado';
    const message = type === 'password'
      ? 'Tu contraseña ha sido actualizada exitosamente.'
      : 'Tu autenticación de dos factores ha sido desactivada.';

    const htmlBody = `
      <h2>Hola ${firstName},</h2>
      <p>${message}</p>
      <p>Si no realizaste este cambio, contacta inmediatamente con soporte.</p>
    `;

    await SESUtil.enviarEmail(email, subject, htmlBody, message);
    logger.info('Reset confirmation email sent', { email, type });
  }
}

module.exports = new AuthClientService();