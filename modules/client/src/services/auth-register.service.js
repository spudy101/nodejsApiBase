'use strict';

const { v4: uuidv4 } = require('uuid');
const crypto         = require('crypto');
const { sequelize }  = require('../../../../shared/models');

const userRepository                       = require('../../../kyc/repositories/user.repository');
const personRepository                     = require('../../../kyc/repositories/person.repository');
const personContactRepository              = require('../../../kyc/repositories/person-contact.repository');
const resetCredentialsRepository           = require('../../../kyc/repositories/reset-credentials.repository');
const userNotificationPreferenceRepository = require('../../../notification/repositories/user-notification-preference.repository');
const roleRepository                       = require('../../../kyc/repositories/role.repository');

const CognitoUtil      = require('../../../../shared/utils/cognito.util');
const NotificationUtil = require('../../../notification/src/services/notification-creation.service');
const AppError         = require('../../../../shared/utils/app-error.util');
const { logger }       = require('../../../../shared/utils/logger.util');
const { frontend, SECURITY, USER_ROLES } = require('../../../../shared/constants');
const { RegisterResponseDTO } = require('../dtos/auth-register.dto');

class AuthRegisterService {

  // ============================================================
  // REGISTER
  // ============================================================

  /**
   * Registra un nuevo usuario en BD y Cognito.
   *
   * Orden de operaciones:
   *   1. Crear usuario en Cognito (sin IDs aún — no los tenemos)
   *   2. Crear en BD — obtenemos los IDs reales
   *   3. Actualizar custom attributes en Cognito con los IDs reales
   *   4. Autenticar y retornar tokens
   *
   * Si cualquier paso falla después de que Cognito fue creado,
   * se elimina el usuario de Cognito como rollback.
   *
   * @param {Object} userData
   */
  async register(userData) {
    const {
      email, password, firstName, lastName,
      middleName, secondLastName, nationalId,
      genderId, countryId,
    } = userData;

    await this._validateRegistration(email, nationalId);

    const cognitoUsername = `user_${uuidv4()}`;
    let cognitoCreated    = false;

    try {
      // 1. Cognito primero — aún sin custom attributes (no tenemos los IDs de BD)
      const cognitoUser = await CognitoUtil.createUser({
        username: cognitoUsername,
        email,
        password,
      });
      cognitoCreated = true;

      // 2. BD — obtenemos los IDs reales
      const defaultRole = await roleRepository.findByName(USER_ROLES.USER);
      if (!defaultRole) throw new Error(`Role ${USER_ROLES.USER} not found in database`);

      const { user, person, personContact } = await this._createUserInDB({
        email, firstName, lastName, middleName, secondLastName,
        nationalId, genderId, countryId, password,
        cognitoUsername,
        cognitoSub: cognitoUser.sub,
        roleId: defaultRole.id,
      });

      // 3. Actualizar custom attributes con los IDs reales de BD
      await CognitoUtil.updateUserCustomAttributes(cognitoUsername, {
        userId:     user.id,
        personId:   person.id,
        roleId:     defaultRole.id,
        firstName,
        lastName,
        nationalId,
      });

      // 4. Autenticar para retornar tokens al cliente
      const tokens = await CognitoUtil.authenticateUser(cognitoUsername, password);

      logger.info('User registered successfully', { userId: user.id, email });

      setImmediate(() => {
        this._sendNotification('BIENVENIDA', user.id, { nombre: firstName, email })
          .catch(err => logger.error('Error sending welcome notification', { error: err.message }));
      });

      return new RegisterResponseDTO({ user, person, personContact, tokens });

    } catch (error) {
      // Rollback de Cognito si llegó a crearse
      if (cognitoCreated) {
        await CognitoUtil.deleteUser(cognitoUsername)
          .catch(err => logger.error('Error deleting Cognito user on rollback', { error: err.message }));
      }

      // Si es un AppError conocido (ej: conflict, notFound), lo relanzamos tal cual
      // para que el cliente reciba el mensaje correcto
      if (error instanceof AppError) throw error;

      // Error inesperado — genérico para no exponer detalles internos
      logger.error('Unexpected error during registration', { error: error.message, email });
      throw AppError.internal('Error al crear usuario. Intenta nuevamente');
    }
  }

  // ============================================================
  // RESET CREDENTIALS
  // ============================================================

  /**
   * Solicita reset de password o MFA.
   * Responde siempre con null (200) para no revelar si el email existe.
   */
  async requestResetCredentials(data) {
    const { email, type } = data;

    const personContact = await personContactRepository.findByEmail(email, {
      include: [{
        association: 'person',
        include: [{ association: 'user', attributes: ['id', 'is_active'] }],
      }],
    });

    if (!personContact?.person?.user || !personContact.person.user.is_active) {
      logger.info('Reset requested for non-existent or inactive account', { email, type });
      return null;
    }

    const user      = personContact.person.user;
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SECURITY.RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000);

    await resetCredentialsRepository.create({
      user_id:    user.id,
      token,
      type,
      email,
      expires_at: expiresAt,
    });

    const resetUrl  = `${frontend.resetCredentialUrl}-${type === 'password' ? 'password' : 'totp'}?token=${token}&type=${type}`;
    const firstName = personContact.person?.first_name || 'Usuario';
    const tipoNotif = type === 'password' ? 'SOLICITUD_RESET_PASSWORD' : 'SOLICITUD_RESET_MFA';

    setImmediate(() => {
      this._sendNotification(tipoNotif, user.id, {
        nombre:            firstName,
        email,
        resetUrl,
        minutosExpiracion: SECURITY.RESET_TOKEN_EXPIRATION_MINUTES,
      }).catch(err => logger.error('Error sending reset notification', { error: err.message }));
    });

    logger.info('Reset credentials requested', { userId: user.id, type });
    return null;
  }

  /**
   * Confirma reset de credenciales con el token.
   *
   * Orden de operaciones (ambos tipos usan Cognito primero, BD después):
   *
   * password:
   *   1. Cognito — valida requisitos de fuerza y actualiza  ← cognitoUpdated = true
   *   2. BD — si falla, revertir Cognito
   *
   * mfa:
   *   1. Cognito — deshabilitar TOTP  ← cognitoUpdated = true
   *   2. BD — si falla, revertir Cognito
   *
   * Usamos bandera booleana para saber si Cognito llegó a actualizarse,
   * evitando comparar strings de mensajes que pueden cambiar.
   */
  async confirmResetCredentials(data) {
    const { token, newPassword, type } = data;

    const resetRecord = await resetCredentialsRepository.findValidToken(token, {
      include: [{
        association: 'user',
        include: [{
          association: 'person',
          attributes:  ['id', 'first_name'],
          include:     [{ association: 'contact', attributes: ['email'] }],
        }],
        attributes: ['id', 'cognito_username'],
      }],
    });

    if (!resetRecord)               throw AppError.badRequest('Token inválido o expirado');
    if (resetRecord.type !== type)  throw AppError.badRequest('Tipo de reset incorrecto');

    const user = resetRecord.user;
    if (!user) throw AppError.notFound('Usuario no encontrado');

    let cognitoUpdated = false;
    let tipoNotif;

    const transaction = await sequelize.transaction();

    try {
      if (type === 'password') {
        if (!newPassword) throw AppError.badRequest('La nueva contraseña es requerida');

        // 1. Cognito primero — valida requisitos de fuerza
        await CognitoUtil.changeUserPassword(user.cognito_username, newPassword);
        cognitoUpdated = true;

        // 2. BD después
        await userRepository.updatePassword(user.id, newPassword, { transaction });
        tipoNotif = 'RESET_PASSWORD';
        logger.info('Password reset successful', { userId: user.id });

      } else if (type === 'mfa') {
        // 1. Cognito primero
        await CognitoUtil.disableTOTPMFA(user.cognito_username);
        cognitoUpdated = true;

        // 2. BD después
        await userRepository.updateTOTPStatus(user.id, false, { transaction });
        tipoNotif = 'RESET_MFA';
        logger.info('MFA reset successful', { userId: user.id });
      }

      await resetCredentialsRepository.markAsUsed(resetRecord.id, { transaction });
      await transaction.commit();

    } catch (error) {
      await transaction.rollback();

      // Revertir Cognito solo si llegó a actualizarse
      if (cognitoUpdated) {
        if (type === 'password') {
          // No revertimos password en Cognito — no tenemos la contraseña anterior
          // Se loguea como CRITICAL para intervención manual
          logger.error('CRITICAL: Password updated in Cognito but BD update failed', {
            userId: user.id,
            error:  error.message,
          });
        } else if (type === 'mfa') {
          await CognitoUtil.enableTOTPMFA(user.cognito_username)
            .catch(err => logger.error('CRITICAL: Cognito MFA rollback failed on reset', {
              userId: user.id,
              error:  err.message,
            }));
        }
      }

      throw error;
    }

    const firstName = user.person?.first_name || 'Usuario';
    const email     = user.person?.contact?.email;

    setImmediate(() => {
      this._sendNotification(tipoNotif, user.id, { nombre: firstName, email })
        .catch(err => logger.error('Error sending reset confirmation notification', { error: err.message }));
    });

    return null;
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  /**
   * Valida que el email y nationalId no estén ya registrados.
   * Las dos queries corren en paralelo para minimizar latencia.
   * @private
   */
  async _validateRegistration(email, nationalId) {
    const [existingContact, existingPerson] = await Promise.all([
      personContactRepository.findByEmail(email),
      personRepository.findByNationalId(nationalId),
    ]);
    if (existingContact) throw AppError.conflict('El email ya está registrado');
    if (existingPerson)  throw AppError.conflict('El usuario ya existe');
  }

  /**
   * Crea todas las entidades del usuario en BD dentro de una sola transacción:
   * Person → PersonContact → User → UserNotificationPreference (global)
   * @private
   */
  async _createUserInDB({
    email, firstName, lastName, middleName, secondLastName,
    nationalId, genderId, countryId, password,
    cognitoUsername, cognitoSub, roleId,
  }) {
    const transaction = await sequelize.transaction();

    try {
      const person = await personRepository.create({
        first_name:       firstName,
        last_name:        lastName,
        middle_name:      middleName       || null,
        second_last_name: secondLastName   || null,
        national_id:      nationalId,
        gender_id:        genderId         || null,
        country_id:       countryId        || null,
      }, { transaction });

      const personContact = await personContactRepository.create({
        person_id:         person.id,
        email,
        email_verified_at: new Date(),
      }, { transaction });

      const user = await userRepository.create({
        username:         nationalId,
        cognito_username: cognitoUsername,
        password,
        person_id:        person.id,
        role_id:          roleId,
        cognito_sub:      cognitoSub,
      }, { transaction });

      // Crear preferencia global de notificaciones por defecto
      await userNotificationPreferenceRepository.create({
        user_id:                user.id,
        notification_type_code: null,
        allow_push:             true,
        allow_email:            true,
      }, { transaction });

      await transaction.commit();

      logger.info('User created in DB', { userId: user.id });
      return { user, person, personContact };

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Envía una notificación al usuario de forma segura.
   * Los errores se loguean pero no propagan — las notificaciones nunca deben
   * interrumpir el flujo principal.
   * @private
   */
  async _sendNotification(tipo, userId, metadata) {
    try {
      await NotificationUtil.crearNotificacion({
        tipo_notificacion: tipo,
        user_id:           userId,
        related_entity:    null,
        metadata,
      });
    } catch (error) {
      logger.error('Error sending notification', { error: error.message, userId, tipo });
    }
  }
}

module.exports = new AuthRegisterService();