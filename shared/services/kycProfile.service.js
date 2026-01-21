'use strict';

const userRepository = require('../repositories/user.repository');
const { 
    BasicProfileDTO,
    ExtendedProfileDTO,
    LocationDTO,
    ContactInfoResponseDTO,
    UpdateEmailResponseDTO,
    UpdatePhoneResponseDTO,
    ChangeNationalIdResponseDto
} = require('../dtos/kycProfile.dto');
const personContactRepository = require('../repositories/personContact.repository');
const personLocationRepository = require('../repositories/personLocation.repository');
const avatarRepository = require('../repositories/avatar.repository');
const genderRepository = require('../repositories/gender.repository');
const personRepository = require('../repositories/person.repository');
const verificationCodeRepository = require('../repositories/verificationCode.repository');
const CognitoUtil = require('../utils/cognito.util');
const NotificationUtil = require('../utils/notification.util');
const KycSharedUtil = require('../utils/kycShared.util');
const AppError = require('../utils/appError.util');
const { logger } = require('../utils/logger.util');
const { sequelize } = require('../models');

class KycProfileService {

  async getProfile(metadata) {
    const { userId } = metadata;

    const user = await userRepository.findById(userId, {
      include: userRepository.constructor.INCLUDES.basic
    });

    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }

    logger.info('Basic profile retrieved', { userId });
    return new BasicProfileDTO(user);
  }

  async getExtendedProfile(metadata) {
    const { userId } = metadata;

    const user = await userRepository.findById(userId, {
      include: userRepository.constructor.INCLUDES.full
    });

    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }

    logger.info('Extended profile retrieved', { userId });
    return new ExtendedProfileDTO(user);
  }

  async getLocation(metadata) {
    const { personId } = metadata;

    const location = await personLocationRepository.findByPersonId(personId);

    logger.info('Location retrieved', { personId });
    return new LocationDTO(location);
  }

  async getContactInfo(metadata) {
    const { personId } = metadata;

    const contactInfo = await personContactRepository.findByPersonIdWithPrefixes(personId);

    if (!contactInfo) {
      throw AppError.notFound('Información de contacto no encontrada');
    }

    logger.info('Contact info retrieved', { personId });
    return new ContactInfoResponseDTO(contactInfo);
  }

  async updateProfile(data, metadata) {
    const { userId, personId, username, gender_id } = metadata;
    const transaction = await sequelize.transaction();

    try {
      if (data.username && data.username !== username) {
        await this._updateUsername(userId, data.username, transaction);
      }

      if (data.avatar_id) {
        await this._updateAvatar(userId, data.avatar_id, transaction);
      }

      if (data.gender_id) {
        await this._updateGender(personId, data.gender_id, transaction);
      }

      if (data.location) {
        await this._updateLocation(personId, data.location, transaction);
      }

      await transaction.commit();

      logger.info('Profile updated successfully', { userId });

      const updatedUser = await userRepository.findById(userId, {
        include: userRepository.constructor.INCLUDES.full
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

    const transaction = await sequelize.transaction();

    try {
      await this._validateCurrentPassword(passwordHash, currentPassword);
      await this._checkEmailVerified(email);

      const existingContact = await personContactRepository.findByEmail(email);
      if (existingContact && existingContact.person_id !== personId) {
        throw AppError.conflict('El email ya está en uso por otro usuario');
      }

      const personContact = await personContactRepository.findByPersonId(personId);
      const oldEmail = personContact.email;

      await personContact.update({
        email,
        email_verified_at: new Date()
      }, { transaction });

      await CognitoUtil.updateUserEmail(cognitoUsername, email);

      await KycSharedUtil.logChange({
        userId: userId,
        changedByUserId: userId,
        changedByRole: 'user',
        changeType: 'email',
        previousValue: oldEmail,
        newValue: email,
        changeReason: 'Email actualizado por cliente',
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
      }, { transaction });

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

    const transaction = await sequelize.transaction();

    try {
      await this._checkPhoneVerified(phone);
      await this._checkPhoneNotInUse(phone, personId, phone_type);

      const personContact = await personContactRepository.findByPersonId(personId);

      const updateData = this._preparePhoneUpdateData(phone, phone_prefix_id, phone_type);
      await personContact.update(updateData, { transaction });

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
    const { userId, cognitoUsername, passwordHash } = metadata;
    const { currentPassword, newPassword } = data;

    const transaction = await sequelize.transaction();

    try {
      await this._validateCurrentPassword(passwordHash, currentPassword);

      await CognitoUtil.changePassword(cognitoUsername, currentPassword, newPassword);

      await userRepository.updatePassword(userId, newPassword, { transaction });

      await KycSharedUtil.logChange({
        userId: userId,
        changedByUserId: userId,
        changedByRole: 'user',
        changeType: 'password',
        previousValue: 'hidden',
        newValue: 'hidden',
        changeReason: 'Contraseña actualizada por cliente',
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
      }, { transaction });

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
    const { userId, personId, cognitoUsername, passwordHash, nationalId: oldNationalId } = metadata;
    const { newNationalId, currentPassword } = data;

    const transaction = await sequelize.transaction();

    try {
      await this._validateCurrentPassword(passwordHash, currentPassword);

      KycSharedUtil.validateNationalIdByRole(newNationalId, metadata.roleId);

      await this._validateNationalIdUnique(newNationalId);

      await CognitoUtil.updateUserAttribute(cognitoUsername, 'custom:national_id', newNationalId);

      await personRepository.update(personId, { national_id: newNationalId }, { transaction });

      await KycSharedUtil.logChange({
        userId: userId,
        changedByUserId: userId,
        changedByRole: 'user',
        changeType: 'national_id',
        previousValue: oldNationalId,
        newValue: newNationalId,
        changeReason: 'National ID actualizado por cliente',
        ipAddress: auditContext.ip,
        userAgent: auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      logger.info('National ID updated successfully', { userId, newNationalId });

      const updatedUser = await userRepository.findById(userId, {
        include: userRepository.constructor.INCLUDES.basic
      });

      return new ChangeNationalIdResponseDto(updatedUser, oldNationalId, newNationalId);

    } catch (error) {
      await transaction.rollback();

      if (error.message?.includes('Cognito')) {
        logger.error('Cognito error during national_id update', {
          userId,
          error: error.message
        });
      }

      logger.error('Error updating national_id', { userId, error: error.message });
      throw error;
    }
  }

  async deleteAccount(data, metadata, auditContext) {
      const { userId, personId, cognitoUsername, passwordHash, nationalId, email } = metadata;
      const { currentPassword } = data;

      const transaction = await sequelize.transaction();

      try {
        await this._validateCurrentPassword(passwordHash, currentPassword);

        const user = await userRepository.findById(userId, {
          include: userRepository.constructor.INCLUDES.basic
        });

        if (!user) {
          throw AppError.notFound('Usuario no encontrado');
        }

        const firstName = user.person?.first_name || 'Usuario';
        const eliminatedDate = Date.now();
        const newNationalId = `eliminated_${eliminatedDate}_${nationalId}`;

        await personRepository.update(personId, { national_id: newNationalId }, { transaction });

        await userRepository.update(userId, { 
          username: `eliminated_${eliminatedDate}_${user.username}`,
          is_active: false,
          deleted_at: new Date()
        }, { transaction });

        const personContact = await personContactRepository.findByPersonId(personId);

        const contactUpdates = {
          email: `eliminated_${eliminatedDate}_${email}`,
        };

        if (personContact.phone_primary) {
          contactUpdates.phone_primary = `eliminated_${eliminatedDate}_${personContact.phone_primary}`;
        }

        if (personContact.phone_secondary) {
          contactUpdates.phone_secondary = `eliminated_${eliminatedDate}_${personContact.phone_secondary}`;
        }

        await personContactRepository.update(personContact.person_contact_id, contactUpdates, { transaction });

        await KycSharedUtil.logChange({
          userId: userId,
          changedByUserId: userId,
          changedByRole: 'user',
          changeType: 'account_status',
          previousValue: 'active',
          newValue: 'eliminated',
          changeReason: 'Cuenta eliminada por el usuario',
          ipAddress: auditContext.ip,
          userAgent: auditContext.userAgent,
        }, { transaction });

        await CognitoUtil.deleteUser(cognitoUsername);
        logger.info('User deleted from Cognito successfully', { userId, cognitoUsername });

        await transaction.commit();

        if (email) {
          setImmediate(() => {
            NotificationUtil.crearNotificacionDirecta({
              tipo_notificacion: 'CUENTA_ELIMINADA',
              email,
              metadata: { nombre: firstName }
            })
              .catch(err => logger.error('Error sending account deletion email', { 
                userId,
                error: err.message 
              }));
          });
        }

        logger.info('Account deleted successfully', { 
          userId, 
          nationalId: newNationalId 
        });

        return null;

      } catch (error) {
        if (!transaction.finished) {
          await transaction.rollback();
          logger.info('Database transaction rolled back', { userId });
        }

        logger.error('Error deleting account', { 
          userId, 
          error: error.message,
          stack: error.stack 
        });
        throw error;
      }
  }

  async _validateCurrentPassword(passwordHash, currentPassword) {
    const isValid = await userRepository.verifyPassword(currentPassword, passwordHash);
    
    if (!isValid) {
      throw AppError.unauthorized('Contraseña actual incorrecta');
    }
    
    return true;
  }

  async _checkEmailVerified(email) {
    const verificationCode = await verificationCodeRepository.findVerifiedByContact('email', email);

    if (!verificationCode) {
      throw AppError.forbidden('El email debe estar verificado antes de poder actualizarlo');
    }

    return true;
  }

  async _checkPhoneVerified(phone) {
    const verificationCode = await verificationCodeRepository.findVerifiedByContact('phone', phone);

    if (!verificationCode) {
      throw AppError.forbidden('El teléfono debe estar verificado antes de poder actualizarlo');
    }

    return true;
  }

  async _checkPhoneNotInUse(phone, personId, phoneType) {
    const existingPrimary = await personContactRepository.findByPrimaryPhone(phone);
    
    if (existingPrimary && existingPrimary.person_id !== personId) {
      throw AppError.conflict('El teléfono ya está en uso por otro usuario');
    }

    const existingSecondary = await personContactRepository.findBySecondaryPhone(phone);
    
    if (existingSecondary && existingSecondary.person_id !== personId) {
      throw AppError.conflict('El teléfono ya está en uso por otro usuario');
    }
  }

  async _validateNationalIdUnique(nationalId) {
    const existingPerson = await personRepository.findByNationalId(nationalId);
    if (existingPerson) {
      throw AppError.conflict('El National ID ya está registrado');
    }
  }

  async _validateAvatarExists(avatarId) {
    const avatar = await avatarRepository.findById(avatarId);

    if (!avatar) {
      throw AppError.notFound('Avatar no encontrado');
    }

    if (!avatar.is_active) {
      throw AppError.badRequest('Avatar no disponible');
    }
  }

  async _validateGenderExists(genderId) {
    const gender = await genderRepository.findById(genderId);

    if (!gender) {
      throw AppError.notFound('Gender no encontrado');
    }

    if (!gender.is_active) {
      throw AppError.badRequest('Gender no disponible');
    }
  }

  async _updateUsername(userId, newUsername, transaction) {
    const existingUser = await userRepository.findByUsername(newUsername);
    if (existingUser && existingUser.user_id !== userId) {
      throw AppError.conflict('El username ya está en uso');
    }

    await userRepository.update(userId, { username: newUsername }, { transaction });
  }

  async _updateAvatar(userId, avatarId, transaction) {
    await this._validateAvatarExists(avatarId);
    await userRepository.update(userId, { avatar_id: avatarId }, { transaction });
  }

  async _updateGender(personId, genderId, transaction) {
    await this._validateGenderExists(genderId);
    await personRepository.update(personId, { gender_id: genderId }, { transaction });
  }

  async _updateLocation(personId, locationData, transaction) {
    await personLocationRepository.upsertByPersonId(personId, locationData, { transaction });
  }

  _preparePhoneUpdateData(phone, phonePrefixId, phoneType) {
    if (phoneType === 'primary') {
      return {
        phone_primary: phone,
        phone_primary_prefix_id: phonePrefixId,
        phone_primary_verified_at: new Date()
      };
    } else {
      return {
        phone_secondary: phone,
        phone_secondary_prefix_id: phonePrefixId,
        phone_secondary_verified_at: new Date()
      };
    }
  }
}

module.exports = new KycProfileService();