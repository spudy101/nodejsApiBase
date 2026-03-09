'use strict';

const { sequelize }              = require('../../../../shared/models');
const { PersonLocation }         = require('../../../../shared/models'); // ← movido al tope, no dentro de función
const userRepository             = require('../../repositories/user.repository');
const personRepository           = require('../../repositories/person.repository');
const personContactRepository    = require('../../repositories/person-contact.repository');
const avatarRepository           = require('../../repositories/avatar.repository');
const genderRepository           = require('../../repositories/gender.repository');
const verificationCodeRepository = require('../../repositories/verification-code.repository');
const CognitoUtil                = require('../../../../shared/utils/cognito.util');
const KycSharedUtil              = require('../../utils/kyc.util');
const NotificationUtil           = require('../../../notification/src/services/notification-creation.service');
const AppError                   = require('../../../../shared/utils/app-error.util');
const { logger }                 = require('../../../../shared/utils/logger.util');
const bcrypt                     = require('bcryptjs');

const {
  BasicProfileDTO,
  FullProfileDTO,
  UpdateEmailResponseDTO,
  UpdatePhoneResponseDTO,
  UpdateNationalIdResponseDTO,
} = require('../dtos/profile.dto');

class ProfileService {

  // ============================================================
  // QUERIES
  // ============================================================

  async getProfile(userId) {
    const user = await userRepository.findByUserId(userId, 'basic');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    logger.info('Basic profile retrieved', { userId });
    return new BasicProfileDTO(user);
  }

  async getFullProfile(userId) {
    const user = await userRepository.findByUserId(userId, 'full');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    logger.info('Full profile retrieved', { userId });
    return new FullProfileDTO(user);
  }

  // ============================================================
  // MUTATIONS
  // ============================================================

  /**
   * Actualiza username, avatar, género y/o ubicación.
   * Todos los campos son opcionales — el controller ya validó que al menos uno viene.
   */
  async updateProfile(data, userId) {
    const transaction = await sequelize.transaction();

    try {
      const user = await userRepository.findByUserId(userId, 'minimal');
      if (!user) throw AppError.notFound('Usuario no encontrado');

      const firstName = user.person?.first_name || 'Usuario';
      const updates   = {};

      if (data.username !== undefined) {
        const existing = await userRepository.findOne({ username: data.username });
        if (existing && existing.id !== userId) {
          throw AppError.conflict('El username ya está en uso');
        }
        updates.username = data.username;
      }

      if (data.avatarId !== undefined) {
        const avatar = await avatarRepository.findById(data.avatarId);
        if (!avatar)           throw AppError.notFound('Avatar no encontrado');
        if (!avatar.is_active) throw AppError.badRequest('Avatar no disponible');
        updates.avatar_id = data.avatarId;
      }

      if (Object.keys(updates).length > 0) {
        await userRepository.update(userId, updates, { transaction });
      }

      if (data.genderId !== undefined || data.location !== undefined) {
        const personUpdates = {};

        if (data.genderId !== undefined) {
          const gender = await genderRepository.findById(data.genderId);
          if (!gender)           throw AppError.notFound('Gender no encontrado');
          if (!gender.is_active) throw AppError.badRequest('Gender no disponible');
          personUpdates.gender_id = data.genderId;
        }

        if (Object.keys(personUpdates).length > 0) {
          await user.person.update(personUpdates, { transaction });
        }

        if (data.location) {
          await this._updateLocation(user.person_id, data.location, transaction);
        }
      }

      await transaction.commit();

      logger.info('Profile updated', { userId });

      setImmediate(() => {
        this._enviarNotificacion('PROFILE_UPDATED', userId, { nombre: firstName })
          .catch(err => logger.error('Error enviando notificación profile updated', { error: err.message, userId }));
      });

      return this.getFullProfile(userId);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Actualiza el email del usuario.
   *
   * Orden de operaciones:
   *   1. Actualizar BD + audit log dentro de transacción
   *   2. Commit
   *   3. Actualizar Cognito — si falla, revertir BD manualmente
   *
   * NOTA: el rollback de Cognito es best-effort. Si falla el rollback,
   * se loguea el error para intervención manual — la inconsistencia
   * queda registrada y no se propaga al cliente como error genérico.
   */
  async updateEmail(data, metadata) {
    const { userId, cognitoUsername } = metadata;
    const { email, currentPassword }  = data;

    const user = await userRepository.findByUserId(userId, 'minimal');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    const firstName = user.person?.first_name || 'Usuario';

    await this._validatePassword(user.password_hash, currentPassword);

    const verificationCode = await verificationCodeRepository.findVerifiedByContact('email', email);
    if (!verificationCode) {
      throw AppError.forbidden('El email debe estar verificado antes de poder actualizarlo');
    }

    const existingContact = await personContactRepository.findByEmail(email);
    if (existingContact && existingContact.person_id !== user.person_id) {
      throw AppError.conflict('El email ya está en uso por otro usuario');
    }

    const oldEmail = user.person.contact.email;

    if (oldEmail === email) {
      throw AppError.badRequest('El nuevo email es igual al actual');
    }

    // 1. BD primero dentro de transacción
    const transaction = await sequelize.transaction();
    try {
      await user.person.contact.update(
        { email, email_verified_at: new Date() },
        { transaction }
      );

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: userId,
        changedByRole:   'user',
        changeType:      'email',
        previousValue:   oldEmail,
        newValue:        email,
        changeReason:    'Email actualizado por el usuario',
        ipAddress:       metadata.ipAddress,
        userAgent:       metadata.userAgent,
      }, { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // 2. Cognito después del commit — si falla, revertir BD
    try {
      await CognitoUtil.updateUserEmail(cognitoUsername, email);
    } catch (cognitoError) {
      logger.error('Cognito email update failed after DB commit — reverting BD', {
        userId,
        error: cognitoError.message,
      });

      // Revertir BD best-effort
      await personContactRepository.update(
        { email: oldEmail, email_verified_at: null },
        { where: { person_id: user.person_id } }
      ).catch(revertError => logger.error('CRITICAL: BD revert failed after Cognito error', {
        userId,
        error: revertError.message,
      }));

      throw AppError.internal('Error al actualizar el email. Intenta nuevamente');
    }

    logger.info('Email updated', { userId, oldEmail, newEmail: email });

    setImmediate(() => {
      // Notificar al email antiguo
      NotificationUtil.crearNotificacionDirecta({
        tipo_notificacion: 'EMAIL_CHANGED_OLD',
        email:             oldEmail,
        metadata:          { nombre: firstName, email: oldEmail },
      }).catch(err => logger.error('Error enviando notificación email antiguo', { error: err.message, userId }));

      // Confirmar al email nuevo
      this._enviarNotificacion('EMAIL_CHANGED_NEW', userId, { nombre: firstName, email })
        .catch(err => logger.error('Error enviando notificación email nuevo', { error: err.message, userId }));
    });

    return new UpdateEmailResponseDTO(email, new Date());
  }

  /**
   * Actualiza el teléfono del usuario (primary o secondary).
   * El teléfono debe haber sido verificado previamente.
   */
  async updatePhone(data, userId) {
    const { newPhone, prefixId, phoneType } = data;

    const user = await userRepository.findByUserId(userId, 'minimal');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    const firstName = user.person?.first_name || 'Usuario';

    const verificationCode = await verificationCodeRepository.findVerifiedByContact('phone', newPhone);
    if (!verificationCode) {
      throw AppError.forbidden('El teléfono debe estar verificado antes de poder actualizarlo');
    }

    const existingPrimary = await personContactRepository.findByPrimaryPhone(newPhone);
    if (existingPrimary && existingPrimary.person_id !== user.person_id) {
      throw AppError.conflict('El teléfono ya está en uso por otro usuario');
    }

    const existingSecondary = await personContactRepository.findBySecondaryPhone(newPhone);
    if (existingSecondary && existingSecondary.person_id !== user.person_id) {
      throw AppError.conflict('El teléfono ya está en uso por otro usuario');
    }

    const transaction    = await sequelize.transaction();
    const field          = phoneType === 'primary' ? 'phone_primary'            : 'phone_secondary';
    const prefixField    = phoneType === 'primary' ? 'phone_primary_prefix_id'  : 'phone_secondary_prefix_id';
    const verifiedField  = phoneType === 'primary' ? 'phone_primary_verified_at': 'phone_secondary_verified_at';

    try {
      await user.person.contact.update({
        [field]:         newPhone,
        [prefixField]:   prefixId,
        [verifiedField]: new Date(),
      }, { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    logger.info('Phone updated', { userId, phoneType });

    setImmediate(() => {
      this._enviarNotificacion('PHONE_UPDATED', userId, { nombre: firstName })
        .catch(err => logger.error('Error enviando notificación phone updated', { error: err.message, userId }));
    });

    return new UpdatePhoneResponseDTO({
      phone:         newPhone,
      phonePrefixId: prefixId,
      phoneType,
      updatedAt:     new Date(),
    });
  }

  /**
   * Actualiza la contraseña del usuario.
   *
   * Orden de operaciones:
   *   1. Cognito primero (valida requisitos de fuerza de contraseña)
   *   2. BD después — si falla, Cognito quedó actualizado pero BD no
   *
   * Si la BD falla después de Cognito, se loguea como CRITICAL para intervención manual.
   * No revertimos Cognito porque la nueva contraseña ya funciona — revertir crearía
   * más confusión al usuario que no revertir.
   */
  async updatePassword(data, metadata) {
    const { userId, cognitoUsername }      = metadata;
    const { currentPassword, newPassword } = data;

    const user = await userRepository.findByUserId(userId, 'minimal');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    const firstName = user.person?.first_name || 'Usuario';

    await this._validatePassword(user.password_hash, currentPassword);

    // 1. Cognito primero — valida requisitos de fuerza de contraseña
    await CognitoUtil.changeUserPassword(cognitoUsername, newPassword);

    // 2. BD después
    const transaction = await sequelize.transaction();
    try {
      await userRepository.updatePassword(userId, newPassword, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: userId,
        changedByRole:   'user',
        changeType:      'password',
        previousValue:   'hidden',
        newValue:        'hidden',
        changeReason:    'Contraseña actualizada por el usuario',
        ipAddress:       metadata.ipAddress,
        userAgent:       metadata.userAgent,
      }, { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      // No revertimos Cognito — la nueva contraseña ya funciona
      // Logueamos como CRITICAL para intervención manual (BD desincronizada)
      logger.error('CRITICAL: Password updated in Cognito but BD update failed', {
        userId,
        error: error.message,
      });
      throw AppError.internal('Error al actualizar la contraseña. Contacta soporte');
    }

    logger.info('Password updated', { userId });

    setImmediate(() => {
      this._enviarNotificacion('PASSWORD_UPDATED', userId, { nombre: firstName })
        .catch(err => logger.error('Error enviando notificación password updated', { error: err.message, userId }));
    });

    return null;
  }

  /**
   * Actualiza el número de documento del usuario.
   * Requiere validación de contraseña por seguridad.
   */
  async updateNationalId(data, metadata) {
    const { userId, cognitoUsername }        = metadata;
    const { newNationalId, currentPassword } = data;

    const user = await userRepository.findByUserId(userId, 'basic');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    const firstName = user.person?.first_name || 'Usuario';
    const email     = user.person?.contact?.email;

    await this._validatePassword(user.password_hash, currentPassword);

    KycSharedUtil.validateNationalIdByRole(newNationalId, user.role);

    const existing = await userRepository.findByNationalId(newNationalId);
    if (existing && existing.id !== userId) {
      throw AppError.conflict('El número de documento ya está registrado');
    }

    const oldNationalId = user.person.national_id;

    if (oldNationalId === newNationalId) {
      throw AppError.badRequest('El nuevo número de documento es igual al actual');
    }

    // Bandera: solo true si Cognito llegó a actualizarse
    let cognitoUpdated = false;
    const transaction  = await sequelize.transaction();

    try {
      // 1. Cognito primero
      await CognitoUtil.updateUserCustomAttributes(cognitoUsername, { nationalId: newNationalId });
      cognitoUpdated = true;

      // 2. BD después
      await user.person.update({ national_id: newNationalId }, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: userId,
        changedByRole:   'user',
        changeType:      'national_id',
        previousValue:   oldNationalId,
        newValue:        newNationalId,
        changeReason:    'National ID actualizado por el usuario',
        ipAddress:       metadata.ipAddress,
        userAgent:       metadata.userAgent,
      }, { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();

      // Revertir Cognito solo si llegó a actualizarse
      if (cognitoUpdated) {
        await CognitoUtil.updateUserCustomAttributes(cognitoUsername, { nationalId: oldNationalId })
          .catch(err => logger.error('CRITICAL: Cognito nationalId rollback failed', {
            userId,
            error: err.message,
          }));
      }

      throw error;
    }

    logger.info('National ID updated', { userId, oldNationalId, newNationalId });

    setImmediate(() => {
      this._enviarNotificacion('NATIONAL_ID_UPDATED', userId, { nombre: firstName, email })
        .catch(err => logger.error('Error enviando notificación national id updated', { error: err.message, userId }));
    });

    const updatedUser = await userRepository.findByUserId(userId, 'basic');
    return new UpdateNationalIdResponseDTO({ user: updatedUser, oldNationalId, newNationalId });
  }

  /**
   * Elimina la cuenta del usuario (soft delete con ofuscación de datos).
   * Requiere validación de contraseña por seguridad.
   *
   * Orden de operaciones:
   *   1. BD primero (soft delete + ofuscación de datos sensibles)
   *   2. Cognito después del commit
   *
   * Si Cognito falla después del commit, se loguea como CRITICAL.
   * El usuario ya no puede autenticarse en BD pero su cuenta de Cognito sigue activa.
   */
  async deleteAccount(data, metadata) {
    const { userId, cognitoUsername } = metadata;
    const { currentPassword }         = data;

    const user = await userRepository.findByUserId(userId, 'basic');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    await this._validatePassword(user.password_hash, currentPassword);

    const personId      = user.person_id;
    const nationalId    = user.person.national_id;
    const username      = user.username;
    const firstName     = user.person?.first_name || 'Usuario';
    const email         = user.person?.contact?.email;
    const personContact = await personContactRepository.findByPersonId(personId);

    // Generar valores ofuscados con timestamp
    const newNationalId = KycSharedUtil.formatDeletedNationalId(nationalId);
    const newUsername   = KycSharedUtil.formatDeletedUsername(username);
    const newEmail      = KycSharedUtil.formatDeletedEmail(email);

    const contactUpdates = { email: newEmail };
    if (personContact.phone_primary) {
      contactUpdates.phone_primary = KycSharedUtil.formatDeletedPhone(personContact.phone_primary);
    }
    if (personContact.phone_secondary) {
      contactUpdates.phone_secondary = KycSharedUtil.formatDeletedPhone(personContact.phone_secondary);
    }

    // 1. BD primero (soft delete + ofuscación)
    const transaction = await sequelize.transaction();
    try {
      await personRepository.update(personId, { national_id: newNationalId }, { transaction });

      await userRepository.update(userId, {
        username:   newUsername,
        is_active:  false,
        deleted_at: new Date(),
      }, { transaction });

      await personContactRepository.update(personContact.id, contactUpdates, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: userId,
        changedByRole:   'user',
        changeType:      'account_status',
        previousValue:   'active',
        newValue:        'eliminated',
        changeReason:    'Cuenta eliminada por el propio usuario',
        ipAddress:       metadata.ipAddress,
        userAgent:       metadata.userAgent,
      }, { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // 2. Cognito después del commit
    await CognitoUtil.deleteUser(cognitoUsername)
      .catch(err => logger.error('CRITICAL: Account deleted in BD but Cognito deletion failed', {
        userId,
        cognitoUsername,
        error: err.message,
      }));

    logger.info('Account deleted', { userId, deletedNationalId: newNationalId });

    // Notificación al email original (el usuario ya no existe en BD)
    setImmediate(() => {
      NotificationUtil.crearNotificacionDirecta({
        tipo_notificacion: 'CUENTA_ELIMINADA',
        email,
        metadata: { nombre: firstName, email },
      }).catch(err => logger.error('Error enviando notificación cuenta eliminada', {
        userId,
        error: err.message,
      }));
    });

    return null;
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  /** @private */
  async _validatePassword(passwordHash, plainPassword) {
    const isValid = await bcrypt.compare(plainPassword, passwordHash);
    if (!isValid) throw AppError.unauthorized('Contraseña incorrecta');
  }

  /**
   * Upsert de location — crea si no existe, actualiza si ya existe.
   * PersonLocation importado al tope del archivo para evitar require dinámico.
   * @private
   */
  async _updateLocation(personId, locationData, transaction) {
    const location = await PersonLocation.findOne({ where: { person_id: personId } });

    const fields = {
      country_id:    locationData.countryId    || null,
      department_id: locationData.departmentId || null,
      city_id:       locationData.cityId       || null,
      address:       locationData.address      || null,
      postal_code:   locationData.postalCode   || null,
    };

    if (location) {
      await location.update(fields, { transaction });
    } else {
      await PersonLocation.create({ person_id: personId, ...fields }, { transaction });
    }
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

module.exports = new ProfileService();