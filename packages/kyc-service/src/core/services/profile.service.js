'use strict';

const ProfileBaseService = require('./profileBase.service');
const { AppError } = require('@abundbank/shared');
const { logger } = require('@abundbank/shared');

const { 
    BasicProfileDTO,
    ExtendedProfileDTO,
    LocationDTO,
    ContactInfoResponseDTO,
    UpdateEmailResponseDTO,
    UpdatePhoneResponseDTO,
    ChangeNationalIdResponseDto
} = require('../../api/dtos/profile.dto');

/**
 * ProfileService - Operaciones del usuario sobre SU PROPIO perfil
 * Extiende ProfileBaseService para reutilizar lógica común
 */
class ProfileService extends ProfileBaseService {

  async getProfile(metadata) {
    const { userId } = metadata;

    // ✅ UNA SOLA QUERY con include basic
    const user = await this.userRepository.findById(userId, {
      include: this.userRepository.INCLUDES.basic
    });

    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }

    logger.info('Basic profile retrieved', { userId });
    return new BasicProfileDTO(user);
  }

  async getExtendedProfile(metadata) {
    const { userId } = metadata;

    // ✅ UNA SOLA QUERY con include full
    const user = await this.userRepository.findById(userId, {
      include: this.userRepository.INCLUDES.full
    });

    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }

    logger.info('Extended profile retrieved', { userId });
    return new ExtendedProfileDTO(user);
  }

  async getLocation(metadata) {
    const { personId } = metadata;

    // ✅ UNA SOLA QUERY con includes (City, Department, Country)
    const location = await this.personLocationRepository.findByPersonId(personId);

    logger.info('Location retrieved', { personId });
    return new LocationDTO(location);
  }

  async getContactInfo(metadata) {
    const { personId } = metadata;

    // ✅ UNA SOLA QUERY con phone prefixes incluidos
    const contactInfo = await this.personContactRepository.findByPersonIdWithPrefixes(personId);

    if (!contactInfo) {
      throw AppError.notFound('Información de contacto no encontrada');
    }

    logger.info('Contact info retrieved', { personId });
    return new ContactInfoResponseDTO(contactInfo);
  }

  async updateProfile(data, metadata) {
    const { userId, personId } = metadata;
    const transaction = await db.sequelize.transaction();

    try {
      // Actualizar username si cambió
      if (data.username && data.username !== metadata.username) {
        await this.updateUsernameLogic({
          userId,
          newUsername: data.username,
          transaction
        });
      }

      // Actualizar avatar
      if (data.avatar_id) {
        await this.updateAvatarLogic({
          userId,
          avatarId: data.avatar_id,
          transaction
        });
      }

      // Actualizar género
      if (data.gender_id) {
        await this.updateGenderLogic({
          personId,
          genderId: data.gender_id,
          transaction
        });
      }

      // Actualizar ubicación
      if (data.location) {
        await this.updateLocationLogic({
          personId,
          locationData: data.location,
          transaction
        });
      }

      await transaction.commit();

      logger.info('Profile updated successfully', { userId });

      // ✅ UNA SOLA QUERY final para traer perfil completo
      const updatedUser = await this.userRepository.findById(userId, {
        include: this.userRepository.INCLUDES.full
      });

      return new ExtendedProfileDTO(updatedUser);

    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating profile', { userId, error: error.message });
      throw error;
    }
  }

  async updateEmail(data, metadata, auditContext) {
    const { userId, personId, cognitoUsername, passwordHash } = metadata;
    const { email, currentPassword } = data;

    const transaction = await db.sequelize.transaction();

    try {
      // Validar contraseña actual (solo para usuarios)
      await this.validateCurrentPassword(passwordHash, currentPassword);

      // Usar lógica base para actualizar email
      await this.updateEmailLogic({
        personId,
        newEmail: email,
        changedByPersonId: personId,
        changedByRole: 'user',
        changeReason: 'Email actualizado por cliente',
        auditContext,
        transaction,
        cognitoUsername
      });

      await transaction.commit();

      logger.info('Email updated successfully', { userId, newEmail: email });
      return new UpdateEmailResponseDTO(email, new Date());

    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating email', { userId, error: error.message });
      throw error;
    }
  }

  async updatePhone(data, metadata) {
    const { userId, personId } = metadata;
    const { phone, phone_prefix_id, phone_type } = data;

    const transaction = await db.sequelize.transaction();

    try {
      // Usar lógica base para actualizar teléfono
      await this.updatePhoneLogic({
        personId,
        phone,
        phonePrefixId: phone_prefix_id,
        phoneType: phone_type,
        transaction
      });

      await transaction.commit();

      logger.info('Phone updated successfully', { userId, phoneType: phone_type });
      return new UpdatePhoneResponseDTO(phone, phone_prefix_id, phone_type, new Date());

    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating phone', { userId, error: error.message });
      throw error;
    }
  }

  async updatePassword(data, metadata, auditContext) {
    const { userId, personId, cognitoUsername, passwordHash } = metadata;
    const { currentPassword, newPassword } = data;

    const transaction = await db.sequelize.transaction();

    try {
      // Validar contraseña actual (solo para usuarios)
      await this.validateCurrentPassword(passwordHash, currentPassword);

      // Usar lógica base para actualizar contraseña
      await this.updatePasswordLogic({
        userId,
        personId,
        newPassword,
        changedByPersonId: personId,
        changedByRole: 'user',
        changeReason: 'Contraseña actualizada por cliente',
        auditContext,
        transaction,
        cognitoUsername
      });

      await transaction.commit();

      logger.info('Password updated successfully', { userId });
      return null;

    } catch (error) {
      await transaction.rollback();

      if (error.name === 'InvalidPasswordException') {
        throw AppError.badRequest('La contraseña no cumple con los requisitos de seguridad');
      }

      logger.error('Error updating password', { userId, error: error.message });
      throw error;
    }
  }

  async updateNationalId(data, metadata, auditContext) {
    const { userId, personId, passwordHash } = metadata;
    const { newNationalId, currentPassword } = data;

    const transaction = await db.sequelize.transaction();

    try {
      // Validar contraseña actual (solo para usuarios)
      await this.validateCurrentPassword(passwordHash, currentPassword);

      // Usar lógica base para actualizar national_id
      const { oldNationalId, newNationalId: updatedNationalId } = await this.updateNationalIdLogic({
        userId,
        personId,
        newNationalId,
        changedByPersonId: personId,
        changedByRole: 'user',
        changeReason: 'National ID actualizado por cliente',
        auditContext,
        transaction
      });

      await transaction.commit();

      logger.info('National ID updated successfully', { userId, newNationalId: updatedNationalId });

      // ✅ UNA SOLA QUERY final con include basic
      const updatedUser = await this.userRepository.findById(userId, {
        include: this.userRepository.INCLUDES.basic
      });

      return new ChangeNationalIdResponseDto(updatedUser, oldNationalId, updatedNationalId);

    } catch (error) {
      await transaction.rollback();
      logger.error('Error updating national_id', { userId, error: error.message });
      throw error;
    }
  }

  async deleteAccount(data, metadata, auditContext) {
    const { userId, personId, cognitoUsername, passwordHash } = metadata;
    const { currentPassword } = data;

    const transaction = await db.sequelize.transaction();

    try {
      // Validar contraseña actual (solo para usuarios)
      await this.validateCurrentPassword(passwordHash, currentPassword);

      // Usar lógica base para eliminar cuenta
      const { email, firstName } = await this.deleteAccountLogic({
        userId,
        personId,
        changedByPersonId: personId,
        changedByRole: 'user',
        auditContext,
        transaction,
        cognitoUsername
      });

      await transaction.commit();

      // Enviar notificación (async)
      if (email) {
        setImmediate(() => {
          this.enviarNotificacionDirecta('CUENTA_ELIMINADA', email, {
            nombre: firstName
          }).catch(err => logger.error('Error sending account deletion email', { 
            userId,
            error: err.message 
          }));
        });
      }

      logger.info('Account deleted successfully', { userId });

      return null;

    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }

      logger.error('Error deleting account', { 
        userId, 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }
}

module.exports = new ProfileService();