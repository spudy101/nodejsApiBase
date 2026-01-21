'use strict';

const userRepository = require('../../../shared/repositories/user.repository');
const personRepository = require('../../../shared/repositories/person.repository');
const personContactRepository = require('../../../shared/repositories/personContact.repository');
const resetCredentialsRepository = require('../repositories/resetCredentials.repository');
const userNotificationPreferenceRepository = require('../../../shared/repositories/userNotificationPreference.repository');
const roleRepository = require('../../../shared/repositories/role.repository');
const CognitoUtil = require('../../../shared/utils/cognito.util');
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
        this._enviarNotificacion('BIENVENIDA', user.user_id, { nombre: firstName })
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
      email,
      expires_at: expiresAt,
    });

    const resetUrl = `${frontend.resetCredentialUrl}?token=${token}&type=${type}`;

    setImmediate(() => {
      const tipoNotificacion = type === 'password' ? 'SOLICITUD_RESET_PASSWORD' : 'SOLICITUD_RESET_MFA';
      this._enviarNotificacion(tipoNotificacion, user.user_id, {
        nombre: user.person.first_name,
        resetUrl,
        minutosExpiracion: security.expirationMinutes
      })
        .catch(err => logger.error('Error sending reset notification', { error: err.message }));
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

      let tipoNotificacion;
      if (type === 'password') {
        if (!newPassword) {
          throw AppError.badRequest('La nueva contraseña es requerida');
        }
        await userRepository.updatePassword(user.user_id, newPassword, { transaction });
        await CognitoUtil.changeUserPassword(user.cognito_username, newPassword);
        tipoNotificacion = 'RESET_PASSWORD';
        logger.info('Password reset successful', { userId: user.user_id });
      } else if (type === 'mfa') {
        await CognitoUtil.disableTOTPMFA(user.cognito_username);
        await userRepository.updateTOTPStatus(user.user_id, false, { transaction });
        tipoNotificacion = 'RESET_MFA';
        logger.info('MFA reset successful', { userId: user.user_id });
      }

      await resetCredentialsRepository.markAsUsed(resetRecord.reset_credentials_id, { transaction });

      await transaction.commit();

      setImmediate(() => {
        this._enviarNotificacion(tipoNotificacion, user.user_id, { nombre: user.person.first_name })
          .catch(err => {
            logger.error('Error enviando notificación de reset credentials', {
              error: err.message,
              userId: user.user_id
            });
          });
      });

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
        role_id: defaultRole.role_id,
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
   * Envía notificación usando la centralizadora
   * @private
   */
  async _enviarNotificacion(tipo, userId, metadata) {
    try {
      await NotificationUtil.crearNotificacion({
        tipo_notificacion: tipo,
        user_id: userId,
        related_entity: null,
        metadata
      });

      logger.info('Notificación enviada', { userId, tipo });
    } catch (error) {
      logger.error('Error al enviar notificación', { error: error.message, userId, tipo });
    }
  }
}

module.exports = new AuthClientService();