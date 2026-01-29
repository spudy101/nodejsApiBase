'use strict';

const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const UserRepository = require('../../infrastructure/database/repositories/user.repository');
const PersonRepository = require('../../infrastructure/database/repositories/person.repository');
const PersonContactRepository = require('../../infrastructure/database/repositories/personContact.repository');
const ResetCredentialsRepository = require('../../infrastructure/database/repositories/resetCredentials.repository');
const RoleRepository = require('../../infrastructure/database/repositories/role.repository');
const { cognitoUtil } = require('@abundbank/shared');
const NotificationUtil = require('@abundbank/shared');
const { AppError } = require('@abundbank/shared');
const { logger } = require('@abundbank/shared');
const { RegisterResponseDTO } = require('../../api/dtos/auth.dto');
const { frontend } = require('../../../src/config');
const { USER_ROLES, SECURITY } = require('@abundbank/shared');
const db = require('../../infrastructure/database');

// Instanciar repositories
const userRepository = new UserRepository(db.User, db);
const personRepository = new PersonRepository(db.Person, db);
const personContactRepository = new PersonContactRepository(db.PersonContact, db);
const resetCredentialsRepository = new ResetCredentialsRepository(db.ResetCredentials, db);
const roleRepository = new RoleRepository(db.Role, db);

class AuthService {

  /**
   * Registra un nuevo usuario en el sistema
   */
  async register(userData) {
    const { email, password, firstName, lastName, nationalId, genderId, countryId } = userData;

    await this._validateRegistration(email, nationalId);

    // ✅ Generar username único para Cognito (ya lo tienes así)
    const cognitoUsername = `user_${uuidv4()}`;
    let cognitoCreated = false;

    try {
      // 1. CREAR EN COGNITO PRIMERO
      const cognitoUser = await cognitoUtil.createUser({ 
        username: cognitoUsername,
        email, 
        password 
      });
      cognitoCreated = true;

      // 2. CREAR EN BD DESPUÉS
      const { user, person, personContact } = await this._createUserInDB({
        email,
        firstName,
        lastName,
        nationalId,
        genderId,
        countryId,
        password,
        cognitoUsername,
        cognitoSub: cognitoUser.sub
      });

      // 3. NUEVO: Actualizar custom attributes en Cognito
      try {
        await cognitoUtil.adminUpdateUserAttributes(cognitoUsername, {
          'custom:user_id': String(user.id),
          'custom:person_id': String(person.id),
          'custom:role': 'USER', // O el rol que obtengas de defaultRole
          'custom:first_name': firstName,
          'custom:last_name': lastName,
          'custom:national_id': nationalId,
        });
        
        logger.info('Custom attributes set in Cognito', {
          cognitoUsername,
          userId: user.id,
        });
      } catch (attrError) {
        // Log pero no fallar el registro
        logger.warn('Failed to set custom attributes during registration', {
          cognitoUsername,
          error: attrError.message,
        });
      }

      // 4. AUTENTICAR (usar cognitoUsername)
      const tokens = await cognitoUtil.authenticateUser(cognitoUsername, password);
      
      logger.info('User registered successfully', { userId: user.id, email });

      // Enviar notificación de bienvenida (async)
      setImmediate(() => {
        this._enviarNotificacion('BIENVENIDA', user.id, { nombre: firstName })
          .catch(err => logger.error('Error enviando notificación de bienvenida', {
            error: err.message,
            userId: user.id
          }));
      });

      return new RegisterResponseDTO({ user, person, personContact, tokens });

    } catch (error) {
      // Rollback de Cognito si fue creado
      if (cognitoCreated) {
        try {
          await cognitoUtil.deleteUser(cognitoUsername);
          logger.info('Cognito user deleted during rollback', { cognitoUsername });
        } catch (deleteError) {
          logger.error('Error deleting user from Cognito', { 
            cognitoUsername,
            error: deleteError.message 
          });
        }
      }
      
      logger.error('Error in registration', { 
        error: error.message,
        stage: cognitoCreated ? 'db_creation' : 'cognito_creation'
      });
      
      throw AppError.serverError('Error al crear usuario. Intenta nuevamente');
    }
  }

  /**
   * Solicita reset de credenciales (password o MFA)
   * @param {Object} data - Email y tipo de reset
   * @returns {null}
   */
  async requestResetCredentials(data) {
    const { email, type } = data;

    // ✅ UNA SOLA QUERY: Trae PersonContact + Person + User en un solo hit
    const personContact = await personContactRepository.findByEmailWithPerson(email);

    if (!personContact || !personContact.person?.user) {
      logger.info('Reset requested for non-existent email', { email, type });
      return null; // No revelar si el email existe
    }

    const user = personContact.person.user;

    if (!user.is_active) {
      logger.info('Reset requested for inactive user', { email, type });
      return null;
    }

    // 2. Crear token de reset
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + SECURITY.RESET_TOKEN.EXPIRATION_MINUTES * 60 * 1000);
    
    await resetCredentialsRepository.create({
      user_id: user.id,
      token,
      type,
      email,
      expires_at: expiresAt,
    });

    const resetUrl = `${frontend.resetCredentialUrl}-${type === 'password' ? 'password' : 'totp'}?token=${token}&type=${type}`;

    // ✅ Ya tenemos firstName desde el include
    const firstName = personContact.person?.first_name || 'Usuario';

    setImmediate(() => {
      const tipoNotificacion = type === 'password' ? 'SOLICITUD_RESET_PASSWORD' : 'SOLICITUD_RESET_MFA';
      this._enviarNotificacion(tipoNotificacion, user.id, {
        nombre: firstName,
        resetUrl,
        minutosExpiracion: SECURITY.RESET_TOKEN.EXPIRATION_MINUTES
      })
        .catch(err => logger.error('Error sending reset notification', { error: err.message }));
    });

    logger.info('Reset credentials requested', { userId: user.id, type });

    return null;
  }

  /**
   * Confirma el reset de credenciales con el token recibido
   * @param {Object} data - Token, nueva contraseña (opcional) y tipo de reset
   * @returns {null}
   */
  async confirmResetCredentials(data) {
    const { token, newPassword, type } = data;

    // ✅ UNA SOLA QUERY: Trae ResetCredentials + User + Person
    const resetRecord = await resetCredentialsRepository.findValidTokenWithUser(token);

    if (!resetRecord) {
      throw AppError.badRequest('Token inválido o expirado');
    }

    if (resetRecord.type !== type) {
      throw AppError.badRequest('Tipo de reset incorrecto');
    }

    const user = resetRecord.user;

    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }

    const transaction = await db.sequelize.transaction();

    try {
      let tipoNotificacion;
      
      if (type === 'password') {
        if (!newPassword) {
          throw AppError.badRequest('La nueva contraseña es requerida');
        }
        await userRepository.updatePassword(user.id, newPassword, { transaction });
        await cognitoUtil.changeUserPassword(user.cognito_username, newPassword);
        tipoNotificacion = 'RESET_PASSWORD';
        logger.info('Password reset successful', { userId: user.id });
        
      } else if (type === 'mfa') {
        await cognitoUtil.disableTOTPMFA(user.cognito_username);
        await userRepository.updateTOTPStatus(user.id, false, { transaction });
        tipoNotificacion = 'RESET_MFA';
        logger.info('MFA reset successful', { userId: user.id });
      }

      await resetCredentialsRepository.markAsUsed(resetRecord.id, { transaction });

      await transaction.commit();

      // ✅ Ya tenemos firstName desde el include
      const firstName = user.person?.first_name || 'Usuario';

      setImmediate(() => {
        this._enviarNotificacion(tipoNotificacion, user.id, { nombre: firstName })
          .catch(err => {
            logger.error('Error enviando notificación de reset credentials', {
              error: err.message,
              userId: user.id
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

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Valida que el email y nationalId no estén registrados
   * ✅ OPTIMIZADO: Consultas en paralelo
   * @private
   */
  async _validateRegistration(email, nationalId) {
    // ✅ Ejecutar ambas consultas en PARALELO
    const [existingContact, existingPerson] = await Promise.all([
      personContactRepository.existsByEmail(email),
      personRepository.existsByNationalId(nationalId)
    ]);

    if (existingContact) throw AppError.conflict('El email ya está registrado');
    if (existingPerson) throw AppError.conflict('El usuario ya existe');
  }

  /**
   * Crea el usuario, persona y contacto en la base de datos
   * @private
   */
  async _createUserInDB({ 
    email, 
    firstName, 
    lastName, 
    nationalId, 
    genderId, 
    countryId, 
    password,
    cognitoUsername,
    cognitoSub
  }) {
    const transaction = await db.sequelize.transaction();

    try {
      // ✅ Buscar rol en paralelo con la creación (puede optimizarse cacheando)
      const defaultRole = await roleRepository.findActiveByName(USER_ROLES.USER, { transaction });
      
      if (!defaultRole) {
        throw new Error(`Role ${USER_ROLES.USER} not found in database`);
      }

      // Crear Person
      const person = await personRepository.create({
        first_name: firstName,
        last_name: lastName,
        national_id: nationalId,
        gender_id: genderId || null,
        country_id: countryId || null,
      }, { transaction });

      // Crear PersonContact
      const personContact = await personContactRepository.create({
        person_id: person.id,
        email,
        email_verified_at: new Date(),
      }, { transaction });

      // Crear User
      const user = await userRepository.create({
        username: nationalId,
        cognito_username: cognitoUsername,
        password_hash: password, // El repository se encarga del hash
        person_id: person.id,
        role_id: defaultRole.id,
        cognito_sub: cognitoSub,
      }, { transaction });

      await transaction.commit();
      
      logger.info('User created in DB', { userId: user.id, roleId: defaultRole.id });
      
      return { user, person, personContact };
    } catch (error) {
      await transaction.rollback();
      logger.error('Error creating user in DB', { error: error.message });
      throw error;
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
        related_entity: {},
        metadata
      });

      logger.info('Notificación enviada', { userId, tipo });
    } catch (error) {
      logger.error('Error al enviar notificación', { error: error.message, userId, tipo });
    }
  }
}

module.exports = new AuthService();