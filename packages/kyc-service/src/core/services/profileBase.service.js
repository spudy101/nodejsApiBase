'use strict';

const UserRepository = require('../../infrastructure/database/repositories/user.repository');
const PersonRepository = require('../../infrastructure/database/repositories/person.repository');
const PersonContactRepository = require('../../infrastructure/database/repositories/personContact.repository');
const PersonLocationRepository = require('../../infrastructure/database/repositories/personLocation.repository');
const PersonChangeLogRepository = require('../../infrastructure/database/repositories/personChangeLog.repository');
const AvatarRepository = require('../../infrastructure/database/repositories/avatar.repository');
const GenderRepository = require('../../infrastructure/database/repositories/gender.repository');
const { cognitoUtil } = require('@abundbank/shared');
const { NotificationUtil } = require('@abundbank/shared');
const KycSharedUtil = require('../../utils/kycShared.util');
const { AppError } = require('@abundbank/shared');
const { logger } = require('@abundbank/shared');
const db = require('../../infrastructure/database');

/**
 * ProfileBaseService - Sub-servicio con lógica compartida
 * 
 * Este servicio contiene TODA la lógica común entre:
 * - ProfileService (usuario gestiona SU perfil)
 * - PersonService (admin gestiona OTROS usuarios)
 * 
 * NO borrar lógica, solo centralizar para evitar duplicación
 */
class ProfileBaseService {
  constructor() {
    // Instanciar repositories
    this.userRepository = new UserRepository(db.User, db);
    this.personRepository = new PersonRepository(db.Person, db);
    this.personContactRepository = new PersonContactRepository(db.PersonContact, db);
    this.personLocationRepository = new PersonLocationRepository(db.PersonLocation, db);
    this.personChangeLogRepository = new PersonChangeLogRepository(db.PersonChangeLog, db);
    this.avatarRepository = new AvatarRepository(db.Avatar, db);
    this.genderRepository = new GenderRepository(db.Gender, db);
  }

  // ==================== MÉTODOS DE VALIDACIÓN ====================

  /**
   * Valida contraseña actual
   * @param {string} passwordHash - Hash almacenado
   * @param {string} currentPassword - Contraseña a validar
   * @returns {Promise<boolean>}
   * @throws {AppError} Si la contraseña no coincide
   */
  async validateCurrentPassword(passwordHash, currentPassword) {
    const isValid = await this.userRepository.verifyPassword(currentPassword, passwordHash);
    
    if (!isValid) {
      throw AppError.unauthorized('Contraseña actual incorrecta');
    }
    
    return true;
  }

  /**
   * Valida que el national_id sea único
   * @param {string} nationalId - National ID a validar
   * @param {string} excludePersonId - ID de persona a excluir de la búsqueda (opcional)
   * @returns {Promise<boolean>}
   * @throws {AppError} Si ya existe
   */
  async validateNationalIdUnique(nationalId, excludePersonId = null) {
    const existingPerson = await this.personRepository.findByNationalId(nationalId);
    
    if (existingPerson && existingPerson.id !== excludePersonId) {
      throw AppError.conflict('El National ID ya está registrado');
    }
    
    return true;
  }

  /**
   * Valida que el email sea único
   * @param {string} email - Email a validar
   * @param {string} excludePersonId - ID de persona a excluir de la búsqueda (opcional)
   * @returns {Promise<boolean>}
   * @throws {AppError} Si ya existe
   */
  async validateEmailUnique(email, excludePersonId = null) {
    const existingContact = await this.personContactRepository.findByEmail(email);
    
    if (existingContact && existingContact.person_id !== excludePersonId) {
      throw AppError.conflict('El email ya está en uso por otro usuario');
    }
    
    return true;
  }

  /**
   * Valida que el teléfono no esté en uso
   * @param {string} phone - Teléfono a validar
   * @param {string} excludePersonId - ID de persona a excluir
   * @returns {Promise<boolean>}
   * @throws {AppError} Si ya existe
   */
  async validatePhoneNotInUse(phone, excludePersonId) {
    const [existingPrimary, existingSecondary] = await Promise.all([
      this.personContactRepository.findByPrimaryPhone(phone),
      this.personContactRepository.findBySecondaryPhone(phone)
    ]);
    
    if (existingPrimary && existingPrimary.person_id !== excludePersonId) {
      throw AppError.conflict('El teléfono ya está en uso por otro usuario');
    }

    if (existingSecondary && existingSecondary.person_id !== excludePersonId) {
      throw AppError.conflict('El teléfono ya está en uso por otro usuario');
    }
    
    return true;
  }

  /**
   * Valida que el username sea único
   * @param {string} username - Username a validar
   * @param {string} excludeUserId - ID de usuario a excluir (opcional)
   * @returns {Promise<boolean>}
   * @throws {AppError} Si ya existe
   */
  async validateUsernameUnique(username, excludeUserId = null) {
    const existingUser = await this.userRepository.findByUsername(username);
    
    if (existingUser && existingUser.id !== excludeUserId) {
      throw AppError.conflict('El username ya está en uso');
    }
    
    return true;
  }

  /**
   * Valida que un avatar existe y está activo
   * @param {string} avatarId - UUID del avatar
   * @returns {Promise<boolean>}
   * @throws {AppError} Si no existe o no está activo
   */
  async validateAvatarExists(avatarId) {
    const avatar = await this.avatarRepository.findById(avatarId);

    if (!avatar) {
      throw AppError.notFound('Avatar no encontrado');
    }

    if (!avatar.is_active) {
      throw AppError.badRequest('Avatar no disponible');
    }
    
    return true;
  }

  /**
   * Valida que un género existe y está activo
   * @param {string} genderId - UUID del género
   * @returns {Promise<boolean>}
   * @throws {AppError} Si no existe o no está activo
   */
  async validateGenderExists(genderId) {
    const gender = await this.genderRepository.findById(genderId);

    if (!gender) {
      throw AppError.notFound('Gender no encontrado');
    }

    if (!gender.is_active) {
      throw AppError.badRequest('Gender no disponible');
    }
    
    return true;
  }

  // ==================== MÉTODOS DE ACTUALIZACIÓN COMPARTIDOS ====================

  /**
   * Actualiza el email de un usuario
   * @param {Object} params - Parámetros
   * @returns {Promise<Object>}
   */
  async updateEmailLogic(params) {
    const { 
      personId, 
      newEmail, 
      changedByPersonId, 
      changedByRole, 
      changeReason,
      auditContext, 
      transaction,
      cognitoUsername 
    } = params;

    // Validar unicidad
    await this.validateEmailUnique(newEmail, personId);

    // Obtener contact actual
    const personContact = await this.personContactRepository.findByPersonId(personId);
    const oldEmail = personContact.email;

    if (oldEmail === newEmail) {
      throw AppError.badRequest('El nuevo email es igual al actual');
    }

    // Actualizar en BD
    await this.personContactRepository.updateEmail(personContact.id, newEmail, { transaction });

    // Actualizar en Cognito
    await cognitoUtil.updateUserEmail(cognitoUsername, newEmail);

    // Registrar cambio en audit log
    await this.logChange({
      personId,
      changedByPersonId,
      changedByRole,
      changeType: 'email',
      previousValue: oldEmail,
      newValue: newEmail,
      changeReason,
      ipAddress: auditContext.ip,
      userAgent: auditContext.userAgent,
    }, { transaction });

    return { oldEmail, newEmail };
  }

  /**
   * Actualiza la contraseña de un usuario
   * @param {Object} params - Parámetros
   * @returns {Promise<void>}
   */
  async updatePasswordLogic(params) {
    const { 
      userId,
      personId,
      newPassword, 
      changedByPersonId, 
      changedByRole, 
      changeReason,
      auditContext, 
      transaction,
      cognitoUsername 
    } = params;

    // Actualizar en Cognito primero
    await cognitoUtil.changeUserPassword(cognitoUsername, newPassword);

    // Actualizar en BD
    await this.userRepository.updatePassword(userId, newPassword, { transaction });

    // Registrar cambio en audit log
    await this.logChange({
      personId,
      changedByPersonId,
      changedByRole,
      changeType: 'password',
      previousValue: 'hidden',
      newValue: 'hidden',
      changeReason,
      ipAddress: auditContext.ip,
      userAgent: auditContext.userAgent,
    }, { transaction });
  }

  /**
   * Actualiza el national_id de una persona
   * @param {Object} params - Parámetros
   * @returns {Promise<Object>}
   */
  async updateNationalIdLogic(params) {
    const { 
      userId,
      personId, 
      newNationalId, 
      changedByPersonId, 
      changedByRole, 
      changeReason,
      auditContext, 
      transaction 
    } = params;

    // Obtener person actual para el old value
    const person = await this.personRepository.findById(personId);
    const oldNationalId = person.national_id;

    if (oldNationalId === newNationalId) {
      throw AppError.badRequest('El nuevo National ID es igual al actual');
    }

    // Validar unicidad
    await this.validateNationalIdUnique(newNationalId, personId);

    // Actualizar en BD
    await this.personRepository.update(personId, { national_id: newNationalId }, { transaction });
    await this.userRepository.update(userId, { username: newNationalId }, { transaction });

    // Registrar cambio en audit log
    await this.logChange({
      personId,
      changedByPersonId,
      changedByRole,
      changeType: 'national_id',
      previousValue: oldNationalId,
      newValue: newNationalId,
      changeReason,
      ipAddress: auditContext.ip,
      userAgent: auditContext.userAgent,
    }, { transaction });

    return { oldNationalId, newNationalId };
  }

  /**
   * Actualiza el username de un usuario
   * @param {Object} params - Parámetros
   * @returns {Promise<void>}
   */
  async updateUsernameLogic(params) {
    const { userId, newUsername, transaction } = params;

    await this.validateUsernameUnique(newUsername, userId);
    await this.userRepository.update(userId, { username: newUsername }, { transaction });
  }

  /**
   * Actualiza el avatar de un usuario
   * @param {Object} params - Parámetros
   * @returns {Promise<void>}
   */
  async updateAvatarLogic(params) {
    const { userId, avatarId, transaction } = params;

    await this.validateAvatarExists(avatarId);
    await this.userRepository.update(userId, { avatar_id: avatarId }, { transaction });
  }

  /**
   * Actualiza el género de una persona
   * @param {Object} params - Parámetros
   * @returns {Promise<void>}
   */
  async updateGenderLogic(params) {
    const { personId, genderId, transaction } = params;

    await this.validateGenderExists(genderId);
    await this.personRepository.update(personId, { gender_id: genderId }, { transaction });
  }

  /**
   * Actualiza la ubicación de una persona (upsert)
   * @param {Object} params - Parámetros
   * @returns {Promise<void>}
   */
  async updateLocationLogic(params) {
    const { personId, locationData, transaction } = params;

    await this.personLocationRepository.upsertByPersonId(personId, locationData, { transaction });
  }

  /**
   * Actualiza el teléfono de una persona
   * @param {Object} params - Parámetros
   * @returns {Promise<void>}
   */
  async updatePhoneLogic(params) {
    const { personId, phone, phonePrefixId, phoneType, transaction } = params;

    await this.validatePhoneNotInUse(phone, personId);

    const personContact = await this.personContactRepository.findByPersonId(personId);

    if (phoneType === 'primary') {
      await this.personContactRepository.updatePrimaryPhone(
        personContact.id,
        { phone_primary: phone, phone_primary_prefix_id: phonePrefixId },
        { transaction }
      );
    } else {
      await this.personContactRepository.updateSecondaryPhone(
        personContact.id,
        { phone_secondary: phone, phone_secondary_prefix_id: phonePrefixId },
        { transaction }
      );
    }
  }

  /**
   * Elimina la cuenta de un usuario (lógica completa)
   * @param {Object} params - Parámetros
   * @returns {Promise<void>}
   */
  async deleteAccountLogic(params) {
    const { 
      userId,
      personId, 
      changedByPersonId, 
      changedByRole, 
      auditContext, 
      transaction,
      cognitoUsername 
    } = params;

    // Obtener datos actuales
    const [person, personContact, user] = await Promise.all([
      this.personRepository.findById(personId),
      this.personContactRepository.findByPersonId(personId),
      this.userRepository.findById(userId)
    ]);

    const nationalId = person.national_id;
    const email = personContact.email;
    const username = user.username;

    // Formatear datos para eliminación
    const newNationalId = KycSharedUtil.formatDeletedNationalId(nationalId);
    const newEmail = KycSharedUtil.formatDeletedEmail(email);
    const newUsername = KycSharedUtil.formatDeletedUsername(username);

    // Actualizar person
    await this.personRepository.update(personId, {
      national_id: newNationalId
    }, { transaction });

    // Actualizar user
    await this.userRepository.update(userId, {
      username: newUsername,
      is_active: false
    }, { transaction });

    // Actualizar contact
    const contactUpdates = {
      email: newEmail,
    };

    if (personContact.phone_primary) {
      contactUpdates.phone_primary = KycSharedUtil.formatDeletedPhone(personContact.phone_primary);
    }

    if (personContact.phone_secondary) {
      contactUpdates.phone_secondary = KycSharedUtil.formatDeletedPhone(personContact.phone_secondary);
    }

    await this.personContactRepository.update(personContact.id, contactUpdates, { transaction });

    // Registrar en audit log
    await this.logChange({
      personId,
      changedByPersonId,
      changedByRole,
      changeType: 'account_status',
      previousValue: 'active',
      newValue: 'eliminated',
      changeReason: changedByRole === 'user' 
        ? 'Cuenta eliminada por el usuario' 
        : 'Cuenta eliminada por administrador',
      ipAddress: auditContext.ip,
      userAgent: auditContext.userAgent,
    }, { transaction });

    // Eliminar de Cognito (después de commit de BD)
    await cognitoUtil.deleteUser(cognitoUsername);

    return { email, firstName: person.first_name };
  }

  // ==================== MÉTODOS DE LOGGING Y NOTIFICACIONES ====================

  /**
   * Registra cambio en audit log (reemplaza KycSharedUtil.logChange)
   * @param {Object} logData - Datos del cambio
   * @param {Object} options - Opciones (transaction, etc.)
   * @returns {Promise<Object>}
   */
  async logChange(logData, options = {}) {
    const formattedData = KycSharedUtil.buildChangeLogData(logData);
    return await this.personChangeLogRepository.createLog(formattedData, options);
  }

  /**
   * Envía notificación usando NotificationUtil
   * @param {string} tipo - Tipo de notificación
   * @param {string} userId - UUID del usuario
   * @param {Object} metadata - Metadata adicional
   * @returns {Promise<void>}
   */
  async enviarNotificacion(tipo, userId, metadata) {
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

  /**
   * Envía notificación directa a un email (sin user_id)
   * @param {string} tipo - Tipo de notificación
   * @param {string} email - Email destinatario
   * @param {Object} metadata - Metadata adicional
   * @returns {Promise<void>}
   */
  async enviarNotificacionDirecta(tipo, email, metadata) {
    try {
      await NotificationUtil.crearNotificacionDirecta({
        tipo_notificacion: tipo,
        email,
        metadata
      });

      logger.info('Notificación directa enviada', { email, tipo });
    } catch (error) {
      logger.error('Error al enviar notificación directa', { error: error.message, email, tipo });
    }
  }
}

module.exports = ProfileBaseService;